use tauri_plugin_sql::{Migration, MigrationKind};

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
    ];

    tauri::Builder::default()
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
