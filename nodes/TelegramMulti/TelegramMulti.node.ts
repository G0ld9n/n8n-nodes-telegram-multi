import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import {
	deleteMessage,
	editMessage,
	getChat,
	getChatAdministrators,
	sendDocument,
	sendMessage,
	sendPhoto,
	validateBotToken,
} from './GenericFunctions';

export class TelegramMulti implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Telegram Multi',
		name: 'telegramMulti',
		icon: 'file:telegram.svg',
		group: ['communication'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Send messages and interact with multiple Telegram bots',
		defaults: {
			name: 'Telegram Multi',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'telegramMultiApi',
				required: false,
				displayOptions: {
					show: {
						authMethod: ['credentials'],
					},
				},
			},
		],
		properties: [
			// Authentication Method Selection
			{
				displayName: 'Authentication Method',
				name: 'authMethod',
				type: 'options',
				options: [
					{
						name: '?? Encrypted Credentials (Most Secure)',
						value: 'credentials',
						description: 'Use encrypted credentials stored in n8n',
					},
					{
						name: '?? Environment Variable (Recommended)',
						value: 'environment',
						description: 'Use environment variable like {{$env.BOT_TOKEN}}',
					},
					{
						name: '?? Direct Input (Development Only)',
						value: 'direct',
						description: 'Direct token input - not recommended for production',
					},
				],
				default: 'credentials',
				description: 'Choose how to provide the bot token',
			},
			// Environment Variable Token
			{
				displayName: 'Environment Token',
				name: 'envToken',
				type: 'string',
				displayOptions: {
					show: {
						authMethod: ['environment'],
					},
				},
				default: '{{$env.BOT_TOKEN}}',
				placeholder: '{{$env.BOT_TOKEN_NEWS}}',
				description: 'Environment variable containing the bot token',
			},
			// Direct Token Input
			{
				displayName: 'Bot Token',
				name: 'directToken',
				type: 'string',
				typeOptions: {
					password: true,
				},
				displayOptions: {
					show: {
						authMethod: ['direct'],
					},
				},
				default: '',
				placeholder: '123456789:ABCdef...',
				description: 'Bot token from @BotFather (?? Not secure for production)',
			},
			// Resource Selection
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Message',
						value: 'message',
					},
					{
						name: 'Photo',
						value: 'photo',
					},
					{
						name: 'Document',
						value: 'document',
					},
					{
						name: 'Chat',
						value: 'chat',
					},
				],
				default: 'message',
			},
			// Message Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['message'],
					},
				},
				options: [
					{
						name: 'Send',
						value: 'send',
						description: 'Send a message',
						action: 'Send a message',
					},
					{
						name: 'Edit',
						value: 'edit',
						description: 'Edit a message',
						action: 'Edit a message',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a message',
						action: 'Delete a message',
					},
				],
				default: 'send',
			},
			// Photo Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['photo'],
					},
				},
				options: [
					{
						name: 'Send',
						value: 'send',
						description: 'Send a photo',
						action: 'Send a photo',
					},
				],
				default: 'send',
			},
			// Document Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['document'],
					},
				},
				options: [
					{
						name: 'Send',
						value: 'send',
						description: 'Send a document',
						action: 'Send a document',
					},
				],
				default: 'send',
			},
			// Chat Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['chat'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get chat information',
						action: 'Get chat information',
					},
					{
						name: 'Get Administrators',
						value: 'getAdministrators',
						description: 'Get chat administrators',
						action: 'Get chat administrators',
					},
				],
				default: 'get',
			},
			// Chat ID (common for all operations)
			{
				displayName: 'Chat ID',
				name: 'chatId',
				type: 'string',
				default: '',
				placeholder: '@channel_name or -123456789',
				description: 'Chat ID, username (@channel) or group ID (-123456789)',
				required: true,
			},
			// Message Text (for send/edit message operations)
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				typeOptions: {
					alwaysOpenEditWindow: true,
				},
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send', 'edit'],
					},
				},
				default: '',
				placeholder: 'Hello World!',
				description: 'Text of the message to be sent',
				required: true,
			},
			// Message ID (for edit/delete operations)
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['edit', 'delete'],
					},
				},
				default: 0,
				placeholder: '123',
				description: 'ID of the message to edit or delete',
				required: true,
			},
			// Photo URL (for photo operations)
			{
				displayName: 'Photo',
				name: 'photo',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['photo'],
						operation: ['send'],
					},
				},
				default: '',
				placeholder: 'https://example.com/image.jpg',
				description: 'Photo URL or file_id',
				required: true,
			},
			// Document URL (for document operations)
			{
				displayName: 'Document',
				name: 'document',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['send'],
					},
				},
				default: '',
				placeholder: 'https://example.com/document.pdf',
				description: 'Document URL or file_id',
				required: true,
			},
			// Additional Fields
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				options: [
					{
						displayName: 'Parse Mode',
						name: 'parse_mode',
						type: 'options',
						options: [
							{
								name: 'HTML',
								value: 'HTML',
							},
							{
								name: 'Markdown',
								value: 'Markdown',
							},
							{
								name: 'MarkdownV2',
								value: 'MarkdownV2',
							},
						],
						default: '',
						description: 'How to parse the message text',
					},
					{
						displayName: 'Caption',
						name: 'caption',
						type: 'string',
						typeOptions: {
							alwaysOpenEditWindow: true,
						},
						default: '',
						description: 'Caption for photo or document',
					},
					{
						displayName: 'Disable Web Page Preview',
						name: 'disable_web_page_preview',
						type: 'boolean',
						default: false,
						description: 'Whether to disable link previews for links in this message',
					},
					{
						displayName: 'Disable Notification',
						name: 'disable_notification',
						type: 'boolean',
						default: false,
						description: 'Whether to send the message silently',
					},
					{
						displayName: 'Reply to Message ID',
						name: 'reply_to_message_id',
						type: 'number',
						default: 0,
						description: 'If the message is a reply, ID of the original message',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				// Get authentication method and bot token
				const authMethod = this.getNodeParameter('authMethod', i) as string;
				let botToken: string = '';

				switch (authMethod) {
					case 'credentials':
						const credentials = await this.getCredentials('telegramMultiApi', i);
						botToken = credentials.accessToken as string;
						break;

					case 'environment':
						botToken = this.getNodeParameter('envToken', i) as string;
						break;

					case 'direct':
						botToken = this.getNodeParameter('directToken', i) as string;
						break;

					default:
						throw new NodeOperationError(
							this.getNode(),
							`Invalid authentication method: ${authMethod}`,
							{ itemIndex: i }
						);
				}

				// Validate bot token
				if (!botToken) {
					throw new NodeOperationError(
						this.getNode(),
						'Bot token is required',
						{ itemIndex: i }
					);
				}

				if (!validateBotToken(botToken)) {
					throw new NodeOperationError(
						this.getNode(),
						'Invalid bot token format',
						{ itemIndex: i }
					);
				}

				// Get operation parameters
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const chatId = this.getNodeParameter('chatId', i) as string;
				const additionalFields = this.getNodeParameter('additionalFields', i) as any;

				let responseData: any = {};

				// Execute based on resource and operation
				if (resource === 'message') {
					if (operation === 'send') {
						const text = this.getNodeParameter('text', i) as string;
						responseData = await sendMessage.call(
							this,
							chatId,
							text,
							botToken,
							additionalFields
						);
					} else if (operation === 'edit') {
						const text = this.getNodeParameter('text', i) as string;
						const messageId = this.getNodeParameter('messageId', i) as number;
						responseData = await editMessage.call(
							this,
							chatId,
							messageId,
							text,
							botToken,
							additionalFields
						);
					} else if (operation === 'delete') {
						const messageId = this.getNodeParameter('messageId', i) as number;
						responseData = await deleteMessage.call(
							this,
							chatId,
							messageId,
							botToken
						);
					}
				} else if (resource === 'photo') {
					if (operation === 'send') {
						const photo = this.getNodeParameter('photo', i) as string;
						responseData = await sendPhoto.call(
							this,
							chatId,
							photo,
							botToken,
							additionalFields
						);
					}
				} else if (resource === 'document') {
					if (operation === 'send') {
						const document = this.getNodeParameter('document', i) as string;
						responseData = await sendDocument.call(
							this,
							chatId,
							document,
							botToken,
							additionalFields
						);
					}
				} else if (resource === 'chat') {
					if (operation === 'get') {
						responseData = await getChat.call(
							this,
							chatId,
							botToken
						);
					} else if (operation === 'getAdministrators') {
						responseData = await getChatAdministrators.call(
							this,
							chatId,
							botToken
						);
					}
				}

				// Add the response data to return array
				returnData.push({
					json: responseData,
					pairedItem: { item: i },
				});

			} catch (error: any) {
				// Handle errors gracefully
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message || error.toString(),
						},
						pairedItem: { item: i },
					});
				} else {
					throw error;
				}
			}
		}

		return [returnData];
	}
}