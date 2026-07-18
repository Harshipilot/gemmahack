import logging
from apscheduler.schedulers.background import BackgroundScheduler
from data.seed import refresh_from_csv, random_update


def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        refresh_from_csv,
        trigger="interval",
        minutes=2,
        id="csv_refresh",
        replace_existing=True,
    )
    scheduler.add_job(
        random_update,
        trigger="interval",
        seconds=15,
        id="random_update",
        replace_existing=True,
    )
    scheduler.start()
    logging.info("Scheduler started: CSV refresh every 2 minutes and random updates every 15 seconds")
    return scheduler


def shutdown_scheduler(scheduler):
    if scheduler is not None:
        scheduler.shutdown(wait=False)
        logging.info("Scheduler shutdown")
