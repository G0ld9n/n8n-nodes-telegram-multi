import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TelegramMultiApi implements ICredentialType {
	name = 'telegramMultiApi';
	displayName = 'Telegram Multi API';
	documentationUrl = 'https://core.telegram.org/bots/api';
	properties: INodeProperties[] = [
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Bot token from @BotFather (format: 123456789:ABCdef...)',
		},
	];
}
