
## Troubleshooting

### Common Errors
**401 Unauthorized**
- Verify API key is correct and included in headers

**404 Not Found**
- Check if resource ID exists
- Verify URL path is correct

**500 Internal Server Error**
- Retry request with exponential backoff
- Contact support if issue persists

## Best Practices

1. **Rate Limiting**
   - Max 100 requests/minute per API key

2. **Error Handling**
   - Always check response status codes
   - Handle 429 (Too Many Requests) with exponential backoff

3. **Caching**
   - Cache GET responses where appropriate
   - Use If-Modified-Since headers

4. **Versioning**
   - Stick to specified API version in URL
   - Plan for migration before version deprecation