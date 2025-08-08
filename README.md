# 🤖 n8n-nodes-telegram-multi

[![npm version](https://badge.fury.io/js/n8n-nodes-telegram-multi.svg)](https://badge.fury.io/js/n8n-nodes-telegram-multi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**n8n community node for multiple Telegram bots support**

This node solves the main limitation of the standard n8n Telegram node - supporting only one bot token per node. With Telegram Multi, you can use multiple bots in a single workflow with flexible authentication methods.

## ✨ Key Features

- 🔒 **Multiple Authentication Methods**: Encrypted credentials, environment variables, or direct input
- 🤖 **Multiple Bot Support**: Use different bots for different operations in one workflow  
- 🔄 **Drop-in Replacement**: Compatible with standard Telegram node operations
- 🛡️ **Security First**: Three levels of security with token validation
- 🚀 **Production Ready**: Complete error handling, validation, and timeout management

## 📦 Installation

```bash
npm install n8n-nodes-telegram-multi
```

Or install directly in n8n:

1. Go to **Settings** → **Community Nodes**
2. Enter: `n8n-nodes-telegram-multi`
3. Install and restart n8n

## 🔐 Authentication Methods

### 1. 🔒 Encrypted Credentials (Most Secure)
Best for production use with sensitive tokens.

```
Authentication Method: Encrypted Credentials
Credentials: Select your Telegram Multi API credentials
```

### 2. 🔧 Environment Variable (Recommended)  
Perfect for multiple bots and dynamic selection.

```
Authentication Method: Environment Variable
Environment Token: {{$env.BOT_TOKEN_NEWS}}
```

### 3. ⚠️ Direct Input (Development Only)
Quick testing only - not recommended for production.

```
Authentication Method: Direct Input  
Bot Token: 123456789:ABCdef...
```

## 🚀 Use Cases & Examples

### Example 1: Multiple News Channels

Use different bots for different content categories:

```javascript
// Function Node - Determine category
const category = $json.title.includes('crypto') ? 'crypto' : 'tech';

return {
  botToken: category === 'crypto' ? $env.BOT_TOKEN_CRYPTO : $env.BOT_TOKEN_TECH,
  chatId: category === 'crypto' ? '@crypto_news' : '@tech_news',
  message: $json.title
};
```

```
// Telegram Multi Node
Authentication Method: Environment Variable
Environment Token: {{$json.botToken}}
Resource: Message
Operation: Send  
Chat ID: {{$json.chatId}}
Text: {{$json.message}}
```

### Example 2: Alert Priorities

Route different alert levels to different bots:

```javascript  
// Function Node - Alert routing
const alertBots = {
  'critical': $env.BOT_TOKEN_ALERTS,
  'warning': $env.BOT_TOKEN_WARNINGS, 
  'info': $env.BOT_TOKEN_INFO
};

return {
  botToken: alertBots[$json.severity],
  chatId: $json.severity === 'critical' ? '@critical_alerts' : '@general_alerts'
};
```

### Example 3: Multi-tenant System

Different bots for different customers:

```javascript
// Function Node - Customer routing
const customerBots = {
  'customer_a': $env.BOT_TOKEN_CUSTOMER_A,
  'customer_b': $env.BOT_TOKEN_CUSTOMER_B,
  'customer_c': $env.BOT_TOKEN_CUSTOMER_C
};

return {
  botToken: customerBots[$json.customer_id],
  chatId: $json.notification_chat
};
```

## 📋 Supported Operations

### Message Operations
- **Send**: Send text messages with formatting
- **Edit**: Edit existing messages  
- **Delete**: Delete messages

### Photo Operations
- **Send**: Send photos with captions

### Document Operations  
- **Send**: Send documents with captions

### Chat Operations
- **Get**: Get chat information
- **Get Administrators**: Get list of chat administrators

## ⚙️ Configuration Options

### Additional Fields

All operations support these additional options:

- **Parse Mode**: HTML, Markdown, or MarkdownV2
- **Caption**: For photos and documents
- **Disable Web Page Preview**: Hide link previews
- **Disable Notification**: Send silently
- **Reply to Message ID**: Reply to specific message

### Chat ID Formats

The node supports multiple chat ID formats:

- **Numeric ID**: `123456789` (private chat)
- **Negative ID**: `-123456789` (group)  
- **Username**: `@channel_name` (public channel/group)

## 🔧 Environment Variables Setup

Create a `.env` file or set environment variables:

```bash
# Multiple bot tokens for different purposes
BOT_TOKEN_NEWS=1234567890:ABCDEF...
BOT_TOKEN_ALERTS=9876543210:GHIJKL...  
BOT_TOKEN_CRYPTO=5555555555:MNOPQR...
BOT_TOKEN_MINING=7777777777:STUVWX...
BOT_TOKEN_PERSONAL=3333333333:YZABCD...
```

## 🛡️ Security & Validation

The node includes comprehensive security features:

- **Token Validation**: Ensures proper Telegram bot token format
- **Chat ID Validation**: Validates numeric IDs and usernames
- **Input Sanitization**: Prevents XSS and API issues
- **Error Handling**: Network errors, timeouts, API errors
- **Rate Limiting**: Built-in Telegram API rate limit support

## 📊 Comparison with Other Solutions

| Approach | Security | Convenience | Flexibility | Recommendation |
|----------|----------|-------------|-------------|----------------|
| **HTTP Request** | 🔒🔒 | ⭐⭐ | ⭐⭐⭐⭐⭐ | For complex cases |
| **Standard Telegram** | 🔒🔒🔒🔒 | ⭐⭐⭐⭐⭐ | ⭐ | For single bot |
| **Telegram Multi** | 🔒🔒🔒🔒 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Best choice** |

## 🚨 Error Handling

The node provides detailed error messages for common issues:

- Invalid bot token format
- Invalid chat ID format  
- Network connectivity issues
- Telegram API errors
- Message length limits
- Rate limiting

Enable "Continue on Fail" in node settings to handle errors gracefully.

## 🔄 Migration from Standard Telegram Node

Migrating is simple:

1. Replace **Telegram** node with **Telegram Multi**
2. Set **Authentication Method** to "Encrypted Credentials"  
3. Select your existing Telegram credentials
4. All other settings remain the same

## 📈 Advanced Examples

### Dynamic Bot Selection

```javascript
// Function Node - Advanced routing logic
const time = new Date().getHours();
const isWeekend = [0, 6].includes(new Date().getDay());
const priority = $json.priority;

let selectedBot;
if (priority === 'urgent') {
  selectedBot = $env.BOT_TOKEN_URGENT;
} else if (isWeekend || time < 8 || time > 18) {
  selectedBot = $env.BOT_TOKEN_AFTER_HOURS;
} else {
  selectedBot = $env.BOT_TOKEN_BUSINESS;
}

return { botToken: selectedBot };
```

### Conditional Formatting

```javascript
// Function Node - Message formatting
const status = $json.status;
const emoji = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️';
const parseMode = $json.includeHtml ? 'HTML' : 'Markdown';

return {
  text: `${emoji} <b>Status:</b> ${status}\n<i>Details:</i> ${$json.details}`,
  parse_mode: parseMode
};
```

## 🐛 Troubleshooting

### Common Issues

**"Invalid bot token format"**  
- Ensure token follows format: `123456789:ABCdef...`
- Check for extra spaces or characters

**"Chat not found"**  
- Verify chat ID format (@username or -123456789)
- Ensure bot has access to the chat

**"Environment variable not found"**  
- Check variable spelling: `{{$env.BOT_TOKEN_NAME}}`
- Verify environment variable is set

**"Request timeout"**  
- Check network connectivity  
- Try reducing message size

## 💡 Best Practices

1. **Use Environment Variables** for production deployments
2. **Enable Error Handling** with "Continue on Fail"  
3. **Validate Chat IDs** before sending messages
4. **Monitor Rate Limits** for high-volume workflows
5. **Test Thoroughly** in development environment first

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes  
4. Add tests if applicable
5. Submit a pull request

## 🙋‍♂️ Support

- **Issues**: [GitHub Issues](https://github.com/your-username/n8n-nodes-telegram-multi/issues)
- **Documentation**: [n8n Community Forum](https://community.n8n.io)
- **Telegram API**: [Official Documentation](https://core.telegram.org/bots/api)

## 🎉 Changelog

### v0.1.0
- Initial release
- Multiple authentication methods
- All basic Telegram operations  
- Comprehensive error handling
- Full documentation and examples

---

**Made with ❤️ for the n8n community**