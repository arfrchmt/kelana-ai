from sqlalchemy import inspect, text

from database import engine


def run_migration() -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id BIGSERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )
        conn.execute(
            text(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS created_at
                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                """
            )
        )
        conn.execute(text("ALTER TABLE trips ADD COLUMN IF NOT EXISTS user_id BIGINT"))
        conn.execute(
            text(
                """
                ALTER TABLE trips
                ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE
                """
            )
        )
        conn.execute(text("UPDATE trips SET is_active = TRUE WHERE is_active IS NULL"))

        foreign_key_exists = conn.execute(
            text(
                """
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'fk_trips_user_id'
                """
            )
        ).first()

        if foreign_key_exists is None:
            conn.execute(
                text(
                    """
                    ALTER TABLE trips
                    ADD CONSTRAINT fk_trips_user_id
                    FOREIGN KEY (user_id) REFERENCES users(id)
                    """
                )
            )


def print_schema() -> None:
    inspector = inspect(engine)
    print("tables=" + ",".join(inspector.get_table_names()))

    for table_name in ["users", "trips"]:
        print(f"[{table_name}]")
        for column in inspector.get_columns(table_name):
            print(
                f"{column['name']}:{column['type']}:nullable={column['nullable']}"
            )

    print("[foreign_keys trips]")
    for foreign_key in inspector.get_foreign_keys("trips"):
        print(
            f"{foreign_key['name']}:"
            f"{','.join(foreign_key['constrained_columns'])}->"
            f"{foreign_key['referred_table']}"
            f"({','.join(foreign_key['referred_columns'])})"
        )


if __name__ == "__main__":
    run_migration()
    print_schema()
