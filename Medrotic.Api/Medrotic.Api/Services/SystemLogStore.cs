using System.Collections.Concurrent;
using System.Linq;

namespace Medrotic.Api.Services
{
    public interface ISystemLogStore
    {
        void Add(
            string level,
            string message,
            string? source = null,
            string? detail = null,
            string? category = null,
            string? actorUserId = null,
            string? resourceId = null,
            string? resourceType = null);

        IReadOnlyList<SystemLogEntryDto> GetRecent(int limit, string? levelFilter = null);
    }

    public sealed class SystemLogEntryDto
    {
        public string Id { get; init; } = string.Empty;
        public string Level { get; init; } = "info";
        public string Message { get; init; } = string.Empty;
        public DateTime Timestamp { get; init; }
        public string? Source { get; init; }
        public string? Detail { get; init; }
        public string? Category { get; init; }
        public string? ActorUserId { get; init; }
        public string? ResourceId { get; init; }
        public string? ResourceType { get; init; }
    }

    /// <summary>
    /// Thread-safe in-memory ring buffer for admin-visible system logs (dev / lightweight ops).
    /// </summary>
    public sealed class SystemLogStore : ISystemLogStore
    {
        private readonly ConcurrentQueue<SystemLogEntryDto> _queue = new();
        private long _nextId;
        private const int MaxEntries = 1500;

        public void Add(
            string level,
            string message,
            string? source = null,
            string? detail = null,
            string? category = null,
            string? actorUserId = null,
            string? resourceId = null,
            string? resourceType = null)
        {
            var normalized = level?.ToLowerInvariant() switch
            {
                "warning" or "warn" => "warning",
                "error" or "err" => "error",
                _ => "info"
            };

            var entry = new SystemLogEntryDto
            {
                Id = System.Threading.Interlocked.Increment(ref _nextId).ToString(),
                Level = normalized,
                Message = message ?? string.Empty,
                Timestamp = DateTime.UtcNow,
                Source = source,
                Detail = detail,
                Category = category ?? source,
                ActorUserId = actorUserId,
                ResourceId = resourceId,
                ResourceType = resourceType
            };

            _queue.Enqueue(entry);
            while (_queue.Count > MaxEntries && _queue.TryDequeue(out _)) { }
        }

        public IReadOnlyList<SystemLogEntryDto> GetRecent(int limit, string? levelFilter = null)
        {
            var cap = Math.Clamp(limit, 1, 500);
            var snapshot = _queue.ToArray()
                .OrderByDescending(e => long.TryParse(e.Id, out var id) ? id : 0)
                .AsEnumerable();

            if (!string.IsNullOrWhiteSpace(levelFilter) &&
                !string.Equals(levelFilter, "all", StringComparison.OrdinalIgnoreCase))
            {
                var f = levelFilter.ToLowerInvariant();
                snapshot = snapshot.Where(e => string.Equals(e.Level, f, StringComparison.OrdinalIgnoreCase));
            }

            return snapshot.Take(cap).ToList();
        }
    }
}
