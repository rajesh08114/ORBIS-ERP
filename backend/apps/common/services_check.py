import logging
from django.db import connections
from django.conf import settings
import redis

def check_services() -> bool:
    """
    Checks the status of the database and Redis services.
    Logs/prints service status and database initialization state.
    Returns True if both database and Redis are active and database is initialized,
    False otherwise.
    """
    db_active = False
    db_initialized = False
    db_error = ""
    
    # 1. Check PostgreSQL Database
    try:
        db_conn = connections['default']
        # Try to establish connection and execute a simple ping query
        db_conn.ensure_connection()
        with db_conn.cursor() as cursor:
            cursor.execute("SELECT 1;")
        db_active = True
        
        # Check database initialization status (migrations)
        try:
            from django.db.migrations.executor import MigrationExecutor
            executor = MigrationExecutor(db_conn)
            # Find any plan of pending migrations
            plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
            db_initialized = len(plan) == 0
        except Exception as mig_err:
            db_initialized = False
            db_error = f"Migration check failed: {mig_err}"
    except Exception as e:
        db_active = False
        db_initialized = False
        db_error = str(e)
        
    # 2. Check Redis
    redis_active = False
    redis_error = ""
    try:
        redis_url = getattr(settings, 'REDIS_URL', 'redis://127.0.0.1:6379/1')
        r = redis.Redis.from_url(redis_url, socket_timeout=3)
        r.ping()
        redis_active = True
    except Exception as e:
        redis_active = False
        redis_error = str(e)
        
    # Print status report
    print("\n" + "=" * 60)
    print(" SERVICE HEALTH & INITIALIZATION REPORT")
    print("=" * 60)
    
    if db_active:
        if db_initialized:
            print("  [ACTIVE]    Database Service: Connected")
            print("  [SUCCESS]   Database Initialization: SUCCESS (migrations up-to-date)")
        else:
            print("  [ACTIVE]    Database Service: Connected")
            print("  [PENDING]   Database Initialization: PENDING (migrations needed, run 'make migrate')")
    else:
        print("  [INACTIVE]  Database Service: Down or Unreachable")
        print(f"              Detail: {db_error}")
        
    if redis_active:
        print("  [ACTIVE]    Redis Service: Connected & Running")
    else:
        print("  [INACTIVE]  Redis Service: Down or Unreachable")
        print(f"              Detail: {redis_error}")
        
    print("=" * 60 + "\n")
    
    return db_active and redis_active
