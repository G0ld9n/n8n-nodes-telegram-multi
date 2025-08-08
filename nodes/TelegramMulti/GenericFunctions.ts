import {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

/**
 * Validates Telegram bot token format
 */
export function validateBotToken(token: string): boolean {
	if (!token || typeof token !== 'string') {
		return false;
	}
	
	// Telegram bot token format: 123456789:ABCdefGHIjklMNOpqrSTUvwxyz
	// Bot ID: 8-10 digits, Secret: typically 30-45 alphanumeric chars, underscore, hyphen
	const tokenRegex = /^[0-9]{8,10}:[A-Za-z0-9_-]{30,45}$/;
	return tokenRegex.test(token);
}

/**
 * Validates chat ID (supports @username and numeric ID)
 */
export function validateChatId(chatId: string | number): boolean {
	if (!chatId) {
		return false;
	}
	
	// If it's a number or numeric string
	if (typeof chatId === 'number' || /^-?\d+$/.test(chatId.toString())) {
		return true;
	}
	
	// If it's a username (@channel or @username)
	if (typeof chatId === 'string' && chatId.startsWith('@')) {
		const usernameRegex = /^@[a-zA-Z][a-zA-Z0-9_]{4,31}$/;
		return usernameRegex.test(chatId);
	}
	
	return false;
}

/**
 * Sanitizes text content to prevent XSS and API issues
 */
export function sanitizeText(text: string): string {
	if (!text || typeof text !== 'string') {
		return '';
	}
	
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;')
		.trim();
}

/**
 * Makes authenticated request to Telegram API
 */
export async function telegramApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	headers: IDataObject = {},
	botToken?: string,
): Promise<any> {
	
	if (!botToken) {
		throw new NodeOperationError(this.getNode(), 'Bot token is required');
	}
	
	if (!validateBotToken(botToken)) {
		throw new NodeOperationError(
			this.getNode(),
			'Invalid bot token format. Expected format: 123456789:ABCdefGHIjklMNOpqrSTUvwxyz'
		);
	}
	
	const options: IHttpRequestOptions = {
		method,
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
		body,
		qs,
		url: `https://api.telegram.org/bot${botToken}${endpoint}`,
		json: true,
		timeout: 30000, // 30 second timeout
	};
	
	try {
		const response = await this.helpers.request(options);
		
		if (!response.ok) {
			// Handle Telegram API errors
			const errorMessage = response.description || 'Unknown Telegram API error';
			throw new NodeApiError(this.getNode(), response, {
				message: `Telegram API Error: ${errorMessage}`,
				description: `Error Code: ${response.error_code}`,
			});
		}
		
		return response;
		
	} catch (error: any) {
		// Handle network and other errors
		if (error.code === 'ECONNREFUSED') {
			throw new NodeOperationError(
				this.getNode(),
				'Could not connect to Telegram API. Please check your internet connection.'
			);
		}
		
		if (error.code === 'ETIMEDOUT') {
			throw new NodeOperationError(
				this.getNode(),
				'Request to Telegram API timed out. Please try again.'
			);
		}
		
		// Re-throw NodeApiError and NodeOperationError as-is
		if (error instanceof NodeApiError || error instanceof NodeOperationError) {
			throw error;
		}
		
		// Handle other errors
		throw new NodeOperationError(this.getNode(), `Telegram API request failed: ${error.message || error}`);
	}
}

/**
 * Sends a message to Telegram
 */
export async function sendMessage(
	this: IExecuteFunctions,
	chatId: string | number,
	text: string,
	botToken: string,
	additionalFields: IDataObject = {},
): Promise<any> {
	
	if (!validateChatId(chatId)) {
		throw new NodeOperationError(
			this.getNode(),
			`Invalid chat ID: ${chatId}. Use numeric ID or @username format.`
		);
	}
	
	const sanitizedText = sanitizeText(text);
	if (!sanitizedText) {
		throw new NodeOperationError(this.getNode(), 'Message text cannot be empty');
	}
	
	if (sanitizedText.length > 4096) {
		throw new NodeOperationError(
			this.getNode(),
			`Message text is too long (${sanitizedText.length} characters). Maximum is 4096 characters.`
		);
	}
	
	const body: IDataObject = {
		chat_id: chatId,
		text: sanitizedText,
		...additionalFields,
	};
	
	return await telegramApiRequest.call(this, 'POST', '/sendMessage', body, {}, {}, botToken);
}

/**
 * Sends a photo to Telegram
 */
export async function sendPhoto(
	this: IExecuteFunctions,
	chatId: string | number,
	photo: string,
	botToken: string,
	additionalFields: IDataObject = {},
): Promise<any> {
	
	if (!validateChatId(chatId)) {
		throw new NodeOperationError(
			this.getNode(),
			`Invalid chat ID: ${chatId}. Use numeric ID or @username format.`
		);
	}
	
	if (!photo) {
		throw new NodeOperationError(this.getNode(), 'Photo URL or file_id is required');
	}
	
	const body: IDataObject = {
		chat_id: chatId,
		photo,
		...additionalFields,
	};
	
	// Sanitize caption if present
	if (body.caption && typeof body.caption === 'string') {
		body.caption = sanitizeText(body.caption);
		if (body.caption.length > 1024) {
			throw new NodeOperationError(
				this.getNode(),
				`Photo caption is too long (${body.caption.length} characters). Maximum is 1024 characters.`
			);
		}
	}
	
	return await telegramApiRequest.call(this, 'POST', '/sendPhoto', body, {}, {}, botToken);
}

/**
 * Sends a document to Telegram
 */
export async function sendDocument(
	this: IExecuteFunctions,
	chatId: string | number,
	document: string,
	botToken: string,
	additionalFields: IDataObject = {},
): Promise<any> {
	
	if (!validateChatId(chatId)) {
		throw new NodeOperationError(
			this.getNode(),
			`Invalid chat ID: ${chatId}. Use numeric ID or @username format.`
		);
	}
	
	if (!document) {
		throw new NodeOperationError(this.getNode(), 'Document URL or file_id is required');
	}
	
	const body: IDataObject = {
		chat_id: chatId,
		document,
		...additionalFields,
	};
	
	// Sanitize caption if present
	if (body.caption && typeof body.caption === 'string') {
		body.caption = sanitizeText(body.caption);
		if (body.caption.length > 1024) {
			throw new NodeOperationError(
				this.getNode(),
				`Document caption is too long (${body.caption.length} characters). Maximum is 1024 characters.`
			);
		}
	}
	
	return await telegramApiRequest.call(this, 'POST', '/sendDocument', body, {}, {}, botToken);
}

/**
 * Gets chat information
 */
export async function getChat(
	this: IExecuteFunctions,
	chatId: string | number,
	botToken: string,
): Promise<any> {
	
	if (!validateChatId(chatId)) {
		throw new NodeOperationError(
			this.getNode(),
			`Invalid chat ID: ${chatId}. Use numeric ID or @username format.`
		);
	}
	
	const body: IDataObject = {
		chat_id: chatId,
	};
	
	return await telegramApiRequest.call(this, 'POST', '/getChat', body, {}, {}, botToken);
}

/**
 * Gets chat administrators
 */
export async function getChatAdministrators(
	this: IExecuteFunctions,
	chatId: string | number,
	botToken: string,
): Promise<any> {
	
	if (!validateChatId(chatId)) {
		throw new NodeOperationError(
			this.getNode(),
			`Invalid chat ID: ${chatId}. Use numeric ID or @username format.`
		);
	}
	
	const body: IDataObject = {
		chat_id: chatId,
	};
	
	return await telegramApiRequest.call(this, 'POST', '/getChatAdministrators', body, {}, {}, botToken);
}

/**
 * Edits a message
 */
export async function editMessage(
	this: IExecuteFunctions,
	chatId: string | number,
	messageId: number,
	text: string,
	botToken: string,
	additionalFields: IDataObject = {},
): Promise<any> {
	
	if (!validateChatId(chatId)) {
		throw new NodeOperationError(
			this.getNode(),
			`Invalid chat ID: ${chatId}. Use numeric ID or @username format.`
		);
	}
	
	if (!messageId || typeof messageId !== 'number') {
		throw new NodeOperationError(this.getNode(), 'Valid message ID is required');
	}
	
	const sanitizedText = sanitizeText(text);
	if (!sanitizedText) {
		throw new NodeOperationError(this.getNode(), 'Message text cannot be empty');
	}
	
	if (sanitizedText.length > 4096) {
		throw new NodeOperationError(
			this.getNode(),
			`Message text is too long (${sanitizedText.length} characters). Maximum is 4096 characters.`
		);
	}
	
	const body: IDataObject = {
		chat_id: chatId,
		message_id: messageId,
		text: sanitizedText,
		...additionalFields,
	};
	
	return await telegramApiRequest.call(this, 'POST', '/editMessageText', body, {}, {}, botToken);
}

/**
 * Deletes a message
 */
export async function deleteMessage(
	this: IExecuteFunctions,
	chatId: string | number,
	messageId: number,
	botToken: string,
): Promise<any> {
	
	if (!validateChatId(chatId)) {
		throw new NodeOperationError(
			this.getNode(),
			`Invalid chat ID: ${chatId}. Use numeric ID or @username format.`
		);
	}
	
	if (!messageId || typeof messageId !== 'number') {
		throw new NodeOperationError(this.getNode(), 'Valid message ID is required');
	}
	
	const body: IDataObject = {
		chat_id: chatId,
		message_id: messageId,
	};
	
	return await telegramApiRequest.call(this, 'POST', '/deleteMessage', body, {}, {}, botToken);
}