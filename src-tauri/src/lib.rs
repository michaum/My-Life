use tauri_plugin_sql::{Migration, MigrationKind};

use serde::Deserialize;
use tauri::Manager;
use tauri_plugin_sql::DbInstances;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TransactionStatement {
    sql: String,
    #[serde(default)]
    values: Vec<serde_json::Value>,
}

#[tauri::command]
async fn execute_sqlite_transaction(
    app: tauri::AppHandle,
    statements: Vec<TransactionStatement>,
    require_empty_queue: bool,
) -> Result<(), String> {
    if statements.is_empty() {
        return Err("Transaction contains no statements".into());
    }

    if statements.len() > 100_000 {
        return Err("Transaction exceeds statement limit".into());
    }

    let instances = app.state::<DbInstances>();
    let databases = instances.0.read().await;
    let database = databases
        .get("sqlite:mylife.db")
        .ok_or("Desktop database is not initialized")?;
    let pool = match database {
        tauri_plugin_sql::DbPool::Sqlite(pool) => pool,
    };

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    if require_empty_queue {
        let pending: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM sync_queue")
                .fetch_one(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;

        if pending != 0 {
            return Err("Local changes are pending; snapshot not applied".into());
        }
    }

    for statement in statements {
        let sql = statement.sql.trim();

        if sql.is_empty() {
            return Err("Empty SQL statement".into());
        }

        let mut query = sqlx::query(sql);

        for value in statement.values {
            query = match value {
                serde_json::Value::Null => query.bind(Option::<String>::None),
                serde_json::Value::Bool(v) => query.bind(v),
                serde_json::Value::Number(n) => {
                    if let Some(v) = n.as_i64() {
                        query.bind(v)
                    } else if let Some(v) = n.as_f64() {
                        query.bind(v)
                    } else {
                        return Err("Unsupported SQL number".into());
                    }
                }
                serde_json::Value::String(v) => query.bind(v),
                _ => return Err("Unsupported SQL parameter type".into()),
            };
        }

        query.execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}


#[tauri::command]
async fn read_sqlite_workspace_snapshot(
    app: tauri::AppHandle,
) -> Result<Vec<Vec<serde_json::Value>>, String> {
    use sqlx::{Column, Row, TypeInfo, ValueRef};

    const QUERIES: [&str; 10] = [
        "SELECT * FROM projects ORDER BY created_at",
        "SELECT * FROM tasks ORDER BY sort_order, created_at",
        "SELECT * FROM comments ORDER BY created_at",
        "SELECT * FROM sections ORDER BY sort_order, created_at",
        "SELECT * FROM custom_fields ORDER BY created_at",
        "SELECT id,name,phone,sms_enabled,avatar_data FROM people ORDER BY name COLLATE NOCASE",
        "SELECT * FROM task_values ORDER BY task_id, field_id",
        "SELECT * FROM task_attachments ORDER BY created_at",
        "SELECT * FROM task_recurrence_exceptions ORDER BY created_at",
        "SELECT status_options,filter_labels,list_column_order,list_column_widths,list_column_settings FROM workspace WHERE id='initialized'",
    ];

    let instances = app.state::<DbInstances>();
    let databases = instances.0.read().await;
    let database = databases
        .get("sqlite:mylife.db")
        .ok_or("Desktop database is not initialized")?;
    let pool = match database {
        tauri_plugin_sql::DbPool::Sqlite(pool) => pool,
    };

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    let mut results = Vec::with_capacity(QUERIES.len());

    for statement in QUERIES {
        let rows = sqlx::query(statement)
            .fetch_all(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        let mut converted = Vec::with_capacity(rows.len());

        for row in rows {
            let mut object = serde_json::Map::new();

            for column in row.columns() {
                let name = column.name();

                let raw = row.try_get_raw(name).map_err(|e| e.to_string())?;
                let value: serde_json::Value = if raw.is_null() {
                    serde_json::Value::Null
                } else {
                    match raw.type_info().name() {
                        "TEXT" | "DATE" | "TIME" | "DATETIME" => {
                            serde_json::Value::String(
                                row.try_get::<String, _>(name)
                                    .map_err(|e| e.to_string())?,
                            )
                        }
                        "INTEGER" | "BOOLEAN" => serde_json::json!(
                            row.try_get::<i64, _>(name)
                                .map_err(|e| e.to_string())?
                        ),
                        "REAL" => serde_json::json!(
                            row.try_get::<f64, _>(name)
                                .map_err(|e| e.to_string())?
                        ),
                        "BLOB" => {
                            return Err(format!(
                                "Binary SQLite value is not supported in workspace column {name}"
                            ));
                        }
                        other => {
                            return Err(format!(
                                "Unsupported SQLite column type {other} for {name}"
                            ));
                        }
                    }
                };

                object.insert(name.to_owned(), value);
            }

            converted.push(serde_json::Value::Object(object));
        }

        results.push(converted);
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(results)
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "0000_plain_paper_doll",
            sql: include_str!("../migrations/0000_plain_paper_doll.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "0001_uneven_juggernaut",
            sql: include_str!("../migrations/0001_uneven_juggernaut.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "0002_flippant_princess_powerful",
            sql: include_str!("../migrations/0002_flippant_princess_powerful.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "0003_crazy_frightful_four",
            sql: include_str!("../migrations/0003_crazy_frightful_four.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "0004_keen_black_bolt",
            sql: include_str!("../migrations/0004_keen_black_bolt.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "0005_gigantic_wallop",
            sql: include_str!("../migrations/0005_gigantic_wallop.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "0006_breezy_hannibal_king",
            sql: include_str!("../migrations/0006_breezy_hannibal_king.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "0007_demonic_albert_cleary",
            sql: include_str!("../migrations/0007_demonic_albert_cleary.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 9,
            description: "0008_slimy_supreme_intelligence",
            sql: include_str!("../migrations/0008_slimy_supreme_intelligence.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 10,
            description: "0009_tan_carnage",
            sql: include_str!("../migrations/0009_tan_carnage.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 11,
            description: "0010_login_rate_limits",
            sql: include_str!("../migrations/0010_login_rate_limits.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 12,
            description: "0011_sync_queue",
            sql: include_str!("../migrations/0011_sync_queue.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 13,
            description: "0012_task_recurrence",
            sql: include_str!("../migrations/0012_task_recurrence.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 14,
            description: "0013_project_sidebar_font_color",
            sql: include_str!("../migrations/0013_project_sidebar_font_color.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 15,
            description: "0014_task_attachments",
            sql: include_str!("../migrations/0014_task_attachments.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 16,
            description: "0015_list_column_order",
            sql: include_str!("../migrations/0015_list_column_order.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 17,
            description: "0016_task_recurrence_exceptions",
            sql: include_str!("../migrations/0016_task_recurrence_exceptions.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 18,
            description: "0017_task_recurrence_exception_times",
            sql: include_str!("../migrations/0017_task_recurrence_exception_times.sql"),
            kind: MigrationKind::Up,
        },
      Migration {
            version: 19,
            description: "0018_people_profile_picture",
            sql: include_str!("../migrations/0018_people_profile_picture.sql"),
            kind: MigrationKind::Up,
        },
        // STEP 18F.23I.32F - NOTES FOUNDATION
        Migration {
            version: 20,
            description: "0019_notes_foundation",
            sql: include_str!("../migrations/0019_notes_foundation.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 21,
            description: "0020_list_column_widths",
            sql: include_str!("../migrations/0020_list_column_widths.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 22,
            description: "0021_list_column_settings",
            sql: include_str!("../migrations/0021_list_column_settings.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 23,
            description: "0022_task_classification",
            sql: include_str!("../migrations/0022_task_classification.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![execute_sqlite_transaction, read_sqlite_workspace_snapshot])
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:mylife.db", migrations)
                .build(),
        )
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


