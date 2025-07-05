# Briv AI Application Logs

This directory contains all application logs organized by category and level.

## Log Files

### Category-Specific Logs
- `auth.log` - Authentication and authorization events
- `database.log` - Database queries, connections, and errors
- `ai.log` - AI service calls, responses, and processing
- `admin.log` - Administrative actions and user activity tracking
- `api.log` - API request/response logging
- `system.log` - System-level events and errors

### Combined Logs
- `combined.log` - All log entries in chronological order
- `error.log` - All error-level entries across categories

## Log Entry Format

Each log entry is a JSON object with the following structure:

\`\`\`json
{
  "timestamp": "2025-01-27T10:30:45.123Z",
  "category": "auth|database|ai|admin|api|system",
  "level": "info|warn|error|debug",
  "message": "Human-readable log message",
  "metadata": {
    "additional": "contextual data",
    "request_id": "uuid",
    "user_id": "user_uuid"
  },
  "pid": 12345
}
\`\`\`

## Log Levels

- **ERROR**: System errors, exceptions, failed operations
- **WARN**: Warning conditions, deprecated usage, recoverable errors
- **INFO**: General information, successful operations, state changes
- **DEBUG**: Detailed diagnostic information (development only)

## Log Rotation

Logs are automatically rotated when they exceed 10MB in size. Archived logs are timestamped and preserved for historical analysis.

## Monitoring Examples

### Authentication Events
\`\`\`bash
# View recent login attempts
tail -f logs/auth.log | grep "USER_LOGIN"

# Check for failed authentication
grep "error" logs/auth.log | tail -20
\`\`\`

### Database Performance
\`\`\`bash
# Monitor slow queries (>1000ms)
grep "duration.*[0-9][0-9][0-9][0-9]ms" logs/database.log

# Check database connection issues
grep "error" logs/database.log
\`\`\`

### AI Service Usage
\`\`\`bash
# Monitor AI API calls
tail -f logs/ai.log | grep "Calling Hugging Face API"

# Check AI service errors
grep "error" logs/ai.log | tail -10
\`\`\`

### Admin Activity
\`\`\`bash
# View user registrations
grep "USER_REGISTERED" logs/admin.log

# Monitor reflection creation
grep "REFLECTION_CREATED" logs/admin.log | tail -20
\`\`\`
