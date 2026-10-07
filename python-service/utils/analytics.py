from datetime import datetime
from typing import List, Dict, Any

def analyze_queue_data(tokens: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyzes historical and current queue token records.
    Computes total customer metrics, status breakdowns, average waiting times,
    popular services, and peak hours.
    """
    total_customers = len(tokens)
    completed_count = 0
    cancelled_count = 0
    skipped_count = 0
    
    total_waiting_time = 0.0
    service_counts = {}
    hour_counts = {h: 0 for h in range(24)} # Initialize hours 0 to 23

    for token in tokens:
        status = token.get("status")
        service_name = token.get("service_name", "General Service")
        joined_at_str = token.get("joined_at")
        completed_at_str = token.get("completed_at")
        
        # Count statuses
        if status == "completed":
            completed_count += 1
            if joined_at_str and completed_at_str:
                try:
                    # ISO string parsing: '2026-07-17T23:51:33.000Z'
                    joined_dt = datetime.fromisoformat(joined_at_str.replace("Z", "+00:00"))
                    completed_dt = datetime.fromisoformat(completed_at_str.replace("Z", "+00:00"))
                    
                    wait_minutes = (completed_dt - joined_dt).total_seconds() / 60.0
                    total_waiting_time += max(0.0, wait_minutes)
                except Exception:
                    pass
        elif status == "cancelled":
            cancelled_count += 1
        elif status == "skipped":
            skipped_count += 1
            
        # Popular services
        service_counts[service_name] = service_counts.get(service_name, 0) + 1
        
        # Peak hours analysis
        if joined_at_str:
            try:
                joined_dt = datetime.fromisoformat(joined_at_str.replace("Z", "+00:00"))
                # Store local hour of joining
                hour = joined_dt.hour
                hour_counts[hour] = hour_counts.get(hour, 0) + 1
            except Exception:
                pass

    # Average wait time calculation
    avg_wait = 0
    if completed_count > 0:
        avg_wait = int(total_waiting_time / completed_count)
        
    # Popular services formatter
    popular_services = [
        {"name": name, "count": count}
        for name, count in service_counts.items()
    ]
    popular_services.sort(key=lambda x: x["count"], reverse=True)
    popular_services = popular_services[:5] # Top 5
    
    # Peak hours formatter (only output hours with activity to keep response clean, or full list)
    peak_hours = [
        {"hour": hr, "count": count}
        for hr, count in hour_counts.items()
        if count > 0
    ]
    peak_hours.sort(key=lambda x: x["hour"])
    
    return {
        "total_customers": total_customers,
        "completed_count": completed_count,
        "cancelled_count": cancelled_count,
        "skipped_count": skipped_count,
        "average_waiting_time": avg_wait,
        "popular_services": popular_services,
        "peak_hours": peak_hours
    }
