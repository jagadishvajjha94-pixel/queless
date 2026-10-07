def estimate_wait_time(service_duration: int, waiting_count: int) -> int:
    """
    FIFO queue wait-time estimation algorithm.
    Takes the average service duration (in minutes) and the number of people waiting ahead.
    Returns the estimated wait time in minutes.
    """
    if waiting_count <= 0:
        return 2  # Min 2 minutes buffer time
    
    base_wait = waiting_count * service_duration
    
    # Scale wait-time based on congestion load multiplier (fatigue, overhead, check-in delays)
    if waiting_count > 10:
        congestion_multiplier = 1.15
    elif waiting_count > 5:
        congestion_multiplier = 1.08
    else:
        congestion_multiplier = 1.0
        
    estimated_time = int(base_wait * congestion_multiplier)
    
    return max(2, estimated_time)
