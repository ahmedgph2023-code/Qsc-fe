import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import {
	ArrowLeft,
	BookOpen,
	Check,
	CheckCheck,
	ChevronLeft,
	ChevronRight,
	Clock,
	Copy,
	Eye,
	FileText,
	Filter,
	Image as ImageIcon,
	Link2,
	Info,
	LoaderCircle,
	Lock,
	MessageCircle,
	Mic,
	MoreHorizontal,
	Paperclip,
	Pause,
	Pencil,
	Play,
	Plus,
	Radio,
	RefreshCw,
	Search,
		Send,
		Square,
		Star,
		Trash2,
		Video,
		X,
		Zap,
	ChartColumn,
	Languages,
	LayoutTemplate,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { notifyMetaWhatsAppUnreadChanged } from './whatsapp-api.js';
import { metaWhatsAppApi, getWhatsAppConfigId, setWhatsAppConfigId } from './whatsapp-api.js';
import { WhatsAppAccountSwitcher } from './WhatsAppAccountSwitcher';
import { WhatsAppDemoToggle } from './WhatsAppDemoToggle';
import { AddWhatsAppNumberPopover } from './AddWhatsAppNumberPopover';
import { OpenByPhonePopover } from './OpenByPhonePopover';
import { ImportPhonesPopover } from './ImportPhonesPopover';
import { PhoneImportReviewDialog } from './PhoneImportReviewDialog';
import { WhatsAppMetaSyncPanel } from './WhatsAppMetaSyncPanel';
import { SelectField } from '@/components/phase1/SelectField';
import { getWhatsAppDemoMode, isWhatsAppDemoToggleVisible, setWhatsAppDemoMode } from './whatsapp-api.js';

const WA = {
	shell: 'var(--color-surface-elevated)',
	rail: 'var(--shell-surface)',
	panel: 'var(--color-surface-elevated)',
	header: 'color-mix(in srgb, var(--color-surface-elevated) 97%, transparent)',
	chatBg: 'var(--color-surface)',
	chatPattern: 'url(/bg-whatsapp.svg)',
	border: 'var(--shell-line)',
	separator: 'var(--shell-line)',
	rowBorder: 'transparent',
	input: 'var(--ui-control-bg)',
	search: 'var(--ui-control-bg)',
	searchBorder: 'var(--shell-line)',
	composeBar: 'var(--color-surface-elevated)',
	composeBorder: 'var(--shell-line)',
	text: 'var(--shell-ink)',
	muted: 'var(--shell-muted)',
	icon: 'var(--shell-muted)',
	green: 'var(--shell-blue)',
	greenSoft: 'var(--color-primary-soft)',
	greenText: 'var(--shell-blue)',
	updates: 'var(--shell-blue)',
	bubbleOut: 'var(--color-primary-soft)',
	bubbleIn: 'var(--color-surface-elevated)',
	dateChip: 'color-mix(in srgb, var(--color-surface-elevated) 94%, transparent)',
	dateText: 'var(--shell-muted)',
	chip: 'var(--color-surface-elevated)',
	chipMeta: 'var(--color-primary-soft)',
	warn: 'var(--shell-muted)',
	metaNote: 'var(--shell-blue)',
	tick: 'var(--shell-blue)',
	selected: 'var(--color-primary-soft)',
	overlay: 'color-mix(in srgb, var(--shell-ink) 28%, transparent)',
	field: 'var(--color-primary-soft)',
	radius: 16,
	shadow: 'var(--shadow-2)',
	font: 'var(--app-font-sans, Inter, ui-sans-serif, system-ui, sans-serif)',
};

const PUB = {
	checklist: '/Glossy 3D Checklist Verification Icon.png',
	check: '/check.png',
	secure: '/Secure.png',
	documents: '/documents.png',
	file: '/file.png',
	settings: '/setting-2.png',
	analytics: '/analytics.png',
	chart: '/bar-chart.png',
	broadcast: '/broadcast.png',
	info: '/info.png',
	user: '/user.png',
	trusted: '/Trusted.png',
	warning: '/warning.png',
	chats: '/chats.png',
	templates: '/templates.png',
	phone: '/phone.png',
	usageBilling: '/Usage & Billing.png',
	layers: '/layers.png',
	empty: '/empty-data.png',
	whatsappLogo: '/logo-whatsapp.png',
	excel: '/excel.png',
};

function PubIcon({ src, alt = '', className = 'h-5 w-5 object-contain' }) {
	return <img src={src} alt={alt} className={className} />;
}

const chatWallpaperStyle = {
	backgroundColor: WA.chatBg,
	backgroundImage: `${WA.chatPattern}, radial-gradient(circle at 45% 30%, rgba(255,255,255,.72), transparent 45%)`,
	backgroundRepeat: 'repeat, no-repeat',
	backgroundSize: '360px auto, cover',
	backgroundPosition: 'center top, center',
};

const COPY = {
	en: {
		chats: 'Chats',
		search: 'Search name or phone',
		all: 'All',
		unread: 'Unread',
		leads: 'Leads',
		fav: 'Fav',
		replied: 'Replied',
		unreplied: 'Unreplied',
		window24h: '24h',
		addFavorite: 'Add to favorites',
		removeFavorite: 'Remove from favorites',
		favoriteUpdated: 'Favorite updated',
		favoriteFailed: 'Could not update favorite',
		backToChats: 'Back to chats',
		noRepliedHint: 'People who reply after you send them a Meta template appear here.',
		noUnrepliedHint: 'Chats where the last message is from the customer and you have not replied yet.',
		noWindowHint: 'People still inside the 24-hour customer care window appear here.',
		repliedTitle: 'Sent a template and they replied',
		unrepliedTitle: 'Waiting for your reply',
		window24hTitle: '24h customer care window still open',
		settings: 'Meta config',
		phones: 'Phones',
		connectedPhones: 'Connected phones',
		connectedPhonesHint: 'Manage all WhatsApp phone numbers connected to this workspace.',
		addPhone: 'Add phone',
		phoneLabelTitle: 'Label for this WhatsApp number',
		activePhone: 'Active phone',
		testConnection: 'Test connection',
		phonesNote: 'You can connect multiple phone numbers from the same WABA or different WABAs.',
		learnMore: 'Learn more',
		configuration: 'Configuration',
		webhooks: 'Webhooks',
		activityLog: 'Activity log',
		activityEmptyTitle: 'No activity yet',
		activityEmptyHint: 'Webhook events and account changes will show up here.',
		protectedByMeta: 'Protected by Meta',
		verified: 'Verified',
		activeBadge: 'Active',
		displayNameLabel: 'Display name',
		approvedReady: 'Approved templates are ready to use',
		approvedReadyHint: 'Only approved templates can be sent to customers via WhatsApp.',
		newToTemplates: 'New to templates?',
		exploreMetaLibrary: 'Explore Meta library',
		templateEmptyTitle: 'No templates yet',
		templateEmptyHint: 'Add your first template to start sending approved WhatsApp messages.',
		templatesCrumb: 'Meta Cloud API · Approved Meta templates only can be sent.',
		activity: 'Activity',
		usageBilling: 'Usage & Billing',
		usageBillingTitle: 'WhatsApp Usage & Billing',
		usageBillingHint:
			'Live consumption from your DB + Meta Analytics. Estimated cost is not the final Meta invoice.',
		usageRefresh: 'Refresh',
		usageSent: 'Sent',
		usageDelivered: 'Delivered',
		usageRead: 'Read',
		usageFailed: 'Failed',
		usageEstimated: 'Estimated cost (this month)',
		usageVsPrev: 'vs previous month',
		usageByCategory: 'By category',
		usageByCountry: 'By country',
		usageDaily: 'Daily volume & cost',
		usageTemplates: 'Templates',
		usageDisclaimer:
			'Estimated Meta cost — final amount may differ from the Meta invoice.',
		usageInvoiceNote: 'WhatsApp Manager → Billing is the source of truth for the amount due.',
		usageEmpty: 'No WhatsApp number configured. Add one in settings.',
		usageEmptyCta: 'Add a WhatsApp number',
		usageLoadError: 'Could not load usage & billing',
		usageMetaCost: 'Meta pricing analytics cost',
		usageSources: 'Data sources',
		usageFxRate: 'FX rate',
		usageThisMonth: 'This month',
		usageBillable: 'Billable delivered',
		usageInbound: 'Inbound',
		usageCostUsd: 'USD',
		usageCostEgp: 'QAR',
		usageCountryRates: 'Template rates by country',
		usageSelectCountry: 'Country',
		usagePerMessage: 'Per delivered template message',
		usageRateMarketing: 'Marketing',
		usageRateUtility: 'Utility',
		usageRateAuth: 'Authentication',
		usageRateService: 'Service',
		usageRatePerMsg: '1 msg',
		usageRatePer100: '100 templates',
		usageByCategoryHint: 'Delivered billable messages this month, grouped by template type. Bar = share of total.',
		usageCatMsgs: 'msgs',
		usageCatCost: 'est. cost',
		usageTplType: 'Type',
		usageTplCost: 'Cost',
		backLeads: 'Lead Scout',
		refresh: 'Refresh inbox',
		sync: 'Sync from Meta',
		syncHint:
			'Meta Cloud API cannot pull past chats from another CRM. Sync loads templates and profile from Graph; messages arrive via webhook or a Meta webhook JSON dump.',
		syncFromMeta: 'Sync from Meta',
		syncFromMetaHint:
			'Pulls templates, phone/WABA profile, and webhook subscription. Cloud API cannot download past chats from another CRM.',
		syncCanTitle: 'Available now',
		syncCannotTitle: 'Not available from Meta',
		syncLocalCounts: 'Already stored here',
		syncMessagesLabel: 'messages',
		syncTemplatesPulled: 'Templates on this WABA',
		syncImportJson: 'Import Meta webhook JSON',
		syncImportHint:
			'Only official Meta webhook payloads (object + entry + changes). Duplicates skip by WhatsApp message id (wamid). Generic CRM Excel/CSV of chats is not accepted.',
		syncImportOk: 'Webhook dump applied',
		syncingMeta: 'Syncing from Meta…',
		closeChat: 'Close chat',
		copyNumber: 'Copy number',
		deletePhone: 'Delete this number',
		deletePhoneConfirm: 'Delete this WhatsApp number and its conversations from IPMS? This cannot be undone.',
		openPhone: 'Open by phone',
		phonePlaceholder: 'e.g. 97433112233 or +974 3311…',
		phoneHint: 'Include country code. Qatar 8-digit local numbers are converted to 974…',
		phoneRequired: 'Phone number is required',
		phoneInvalid: 'Invalid phone. Use country code (10–15 digits), e.g. 97433112233',
		phoneNormalized: 'Will send to',
		displayNameOptional: 'Display name (optional)',
		cancel: 'Cancel',
		importPhones: 'Import phones',
		importDownloadTemplate: 'Download Excel template',
		importDownloadHint: 'Demo rows show Qatar phones and an optional name',
		importUploadExcel: 'Upload filled Excel',
		importUploadHint: 'Each row is checked before chats are opened',
		importReviewTitle: 'Review imported phones',
		importReviewHint: 'Valid rows can be saved. Edit invalid rows here, then save.',
		importValid: 'Valid',
		importInvalid: 'Invalid',
		importColPhone: 'Phone',
		importColName: 'Name',
		importColStatus: 'Status',
		importSaveValid: 'Save valid rows',
		importEmptyFile: 'No phone rows found in that file',
		importOpened: 'Opened chats from the valid rows',
		noConversations: 'No conversations yet',
		noConversationsHint: 'Open a lead, open by phone, or wait for an inbound webhook message.',
		emptyChat: 'Select a chat to start messaging',
		businessAccount: 'Business account',
		encryption: 'Messages sent via Meta WhatsApp Cloud API.',
		metaNote:
			'Free-form text/media only within the 24h customer-care window. Outside it, use an approved template.',
		windowOpen: '24h window open',
		windowClosed: 'Template required',
		typeMessage: 'Type a message',
		fastReplies: 'Fast replies',
		fastRepliesHint: 'Saved snippets — click to insert into the message box',
		fastReplySave: 'Save reply',
		fastReplyTitle: 'Title',
		fastReplyBody: 'Reply text',
		fastReplyAdd: 'Add new reply',
		fastReplyDelete: 'Delete',
		fastReplySaved: 'Fast reply saved',
		fastReplyDeleted: 'Fast reply deleted',
		fastReplyEmpty: 'No saved replies yet',
		openPhoneFromChat: 'Opening chat…',
		translate: 'Translate',
		translateToEn: 'Translate to English',
		translateToAr: 'Translate to Arabic',
		translateHide: 'Hide translation',
		translateFailed: 'Translation failed',
		translatedLabel: 'Translation',
		unsupportedMessage: 'This message type isn’t supported here',
		stickerUnavailable: 'Sticker unavailable',
		mediaUnavailable: 'Media unavailable',
		templateName: 'Template name',
		templateLang: 'Language',
		sendTemplate: 'Send template',
		templates: 'Templates',
		templatesHint: 'Approved Meta templates only can be sent. New templates need Meta review.',
		createTemplate: 'Create template',
		addNewTemplate: 'Add new',
		seedTemplates: 'So7ba outreach seeds',
		seedTemplatesHint: 'Preview So7baFit presentation templates, then submit to Meta for review.',
		seedSubmitSelected: 'Submit selected to Meta',
		seedSubmitAll: 'Submit all to Meta',
		seedLoad: 'Load seed preview',
		seedSubmitted: 'Seed templates submitted to Meta',
		cloneAsUtility: 'Clone outreach as UTILITY',
		cloneAsUtilityHint:
			'Creates so7ba_fitness_util_ar / so7ba_fitness_util_en from the existing MARKETING outreach templates and submits them to Meta.',
		cloneAsUtilityOk: 'UTILITY clones submitted to Meta',
		backToTemplates: 'Back to templates',
		templateBody: 'Body text',
		templateHeader: 'Header (optional)',
		templateFooter: 'Footer (optional)',
		templateCategory: 'Category',
		templateVarsTitle: 'Fill template variables',
		templateNoVars: 'No variables — send as-is',
		templatePick: 'Choose a template',
		templateApprovedOnly: 'Only APPROVED templates can be sent',
		templateCreateOk: 'Template submitted to Meta for review',
		templateEditOk: 'Template update submitted to Meta for review',
		editTemplate: 'Edit template',
		saveTemplate: 'Save changes',
		templateEditLocked: 'Name and language cannot be changed after create',
		templateCategoryLocked: 'Category cannot be changed after Meta approval',
		templateCannotEdit: 'Only APPROVED, REJECTED, or PAUSED templates can be edited',
		keepExistingSample: 'Keeping current media sample — upload to replace',
		templateLoadError: 'Could not load templates from Meta',
		templateVarRequired: 'Fill all template variables',
		templateUrlParamInvalid:
			'URL button value is invalid. Use only Latin letters, numbers, and URL-safe characters (e.g. demo or user/123) — no spaces or Arabic text.',
		templateUrlParamHint:
			'This fills the end of the button link. Example: demo or account/abc123 — not a full URL, and not Arabic/emoji.',
		templateUrlParamPlaceholder: 'e.g. demo or user/123',
		refreshTemplates: 'Refresh templates',
		templatePreview: 'Message preview',
		templateMetaDetails: 'Meta requirements',
		templateAcceptTitle: 'How Meta accepts this template',
		templateAcceptSteps: [
			'This form is checked here first so Meta does not receive an invalid payload.',
			'Submit sends the template to Meta Cloud API. Status starts as PENDING.',
			'Meta reviews the name, language, category, body, samples, and buttons.',
			'Only APPROVED templates can be sent to customers. If Meta rejects the request, the error stays on this form so you can edit and resubmit.',
		],
		templateMetaErrorHint: 'Fix the highlighted fields, then submit again. The text below is Meta’s response.',
		templateHeaderOneVar: 'TEXT header allows only one variable: {{1}}',
		templateFooterNoVars: 'Footer cannot contain variables like {{1}}',
		buttonUrlHttps: 'Website buttons must start with https://',
		buttonPhoneInvalid: 'Call-phone buttons need a valid number with country code, e.g. +97433112233',
		buttonMaxUrl: 'Maximum 2 website buttons',
		buttonMaxPhone: 'Maximum 1 call-phone button',
		templateNameRequired: 'Template name is required',
		templateNameInvalid: 'Use lowercase letters, numbers, underscores only (min 3). Example: hello_world',
		templateLangRequired: 'Language is required',
		templateLangInvalid: 'Use a Meta language code like en_US or ar',
		templateCategoryInvalid: 'Category must be UTILITY, MARKETING, or AUTHENTICATION',
		templateBodyRequired: 'Body text is required',
		templateBodyTooLong: 'Body max 1024 characters',
		templateHeaderTooLong: 'Header max 60 characters',
		templateFooterTooLong: 'Footer max 60 characters',
		templateVarsSequential: 'Variables must be sequential: {{1}}, {{2}}, {{3}}…',
		templateVarsMustBeNumbered:
			'Variables must be numbered like {{1}}, {{2}} — not {{name}} or {{user}}',
		templateEmptyList: 'No templates yet. Add your first template to get started.',
		templateHeaderType: 'Header type',
		headerNone: 'None',
		headerText: 'Text',
		headerImage: 'Image',
		headerVideo: 'Video',
		headerDocument: 'Document',
		headerSampleRequired: 'Upload a sample file for this header type',
		headerSampleHint: 'Meta requires a sample media file for review (JPEG/PNG, MP4, or PDF)',
		uploadSample: 'Upload sample',
		changeSample: 'Change sample',
		templateButtons: 'Buttons (optional)',
		addButton: 'Add button',
		buttonType: 'Type',
		buttonText: 'Button text',
		buttonUrl: 'URL',
		buttonPhone: 'Phone number',
		buttonQuickReply: 'Quick reply',
		buttonUrlType: 'Visit website',
		buttonPhoneType: 'Call phone',
		buttonTextRequired: 'Button text is required (max 25 chars)',
		buttonUrlRequired: 'URL is required for website buttons',
		buttonPhoneRequired: 'Phone number is required for call buttons',
		buttonMax: 'Maximum 10 buttons',
		insertVar: 'Insert {{n}}',
		errorDismiss: 'Dismiss',
		metaErrorTitle: 'Meta API error',
		metaInvalidParamHint:
			'Common causes: use {{1}}/{{2}} (not {{name}}); URL buttons need https://; URL button variables must be Latin/URL-safe (not Arabic); footer cannot have variables; TEXT header allows only one {{1}}.',
		helloWorldTestOnlyHint:
			'hello_world only works from Meta Public Test Numbers. On a live business number, send your own APPROVED template for verification instead.',
		metaLibrary: 'Meta library',
		metaLibraryHint: 'Browse Meta ready-made templates, add one to your account, then verify by sending.',
		metaLibrarySearch: 'Search templates…',
		metaLibraryEmpty: 'No library templates found. Try another search.',
		metaLibraryLoadError: 'Could not load Meta template library',
		addFromLibrary: 'Add to my templates',
		verifySend: 'Verify & send',
		verifySendTitle: 'Send verification template',
		verifySendHint:
			'Like Meta API Setup: pick a recipient phone and send the template to verify delivery.',
		verifySendOk: 'Verification template sent',
		libraryAdded: 'Library template submitted to Meta for review',
		verificationTemplates: 'Verification / sample',
		templateColName: 'Name',
		templateColLanguage: 'Language',
		templateColCategory: 'Category',
		templateColStatus: 'Status',
		templateColHeader: 'Header',
		templateColActions: 'Actions',
		templateShow: 'Show',
		templateUse: 'Use',
		templateEdit: 'Edit',
		templateDelete: 'Delete',
		templateCopy: 'Copy',
		templateCopyName: 'Copy name',
		templateCopied: 'Template name copied',
		templateDeleteConfirm: 'Delete this template from Meta? This cannot be undone.',
		templateDeleted: 'Template deleted from Meta',
		templatePreviewTitle: 'Template preview',
		recording: 'Recording',
		recordingHint: 'Pause, stop, or send · trash to cancel',
		recordingCancel: 'Cancel',
		recordingSend: 'Send voice',
		recordingPause: 'Pause',
		recordingResume: 'Resume',
		recordingStop: 'Stop',
		recordingReady: 'Voice note ready',
		recordingReadyHint: 'Tap send to deliver · trash to discard',
		configTitle: 'Meta WhatsApp configuration',
		configSubtitle: 'Paste credentials from your own Meta app. Nothing is filled for you.',
		configHelpAria: 'How to get these values from Meta',
		configHelpTitle: 'Get these values from Meta — not from another QSC account',
		configHelpIntro:
			'Each workspace uses its own WhatsApp Cloud API. Open Meta Developer Console and copy the values below.',
		configHelpOpenConsole: 'Open Meta Developer Console',
		configGuideTabApp: 'App',
		configGuideTabIds: 'IDs',
		configGuideTabTokens: 'Tokens',
		configGuideTabWebhook: 'Webhook',
		configGuideTitleApp: 'Create your Meta app',
		configGuideWhyApp:
			'Phone number ID and WABA come from YOUR WhatsApp product — not from another QSC workspace.',
		configGuideTitleIds: 'Copy the two IDs',
		configGuideWhyIds: 'Phone number ID and WhatsApp Business Account ID are different numbers on the same API Setup page.',
		configGuideTitleTokens: 'Permanent token, App secret, Verify token',
		configGuideWhyTokens:
			'Meta issues the access token and app secret. You create the webhook verify token here, then paste the same string into Meta.',
		configGuideTitleWebhook: 'Callback URL, then save and enable',
		configGuideWhyWebhook:
			'Inbound messages arrive only after this callback URL is pasted into Meta and subscribed to the messages field.',
		configHelpSteps: [
			'Create (or open) your app at developers.facebook.com/apps → add the WhatsApp product.',
			'WhatsApp → API Setup: copy Phone number ID and WhatsApp Business Account ID (WABA ID). They are different numbers.',
			'Meta Business Suite → Business settings → Users → System users: generate a permanent token with whatsapp_business_management + whatsapp_business_messaging, and assign YOUR WABA.',
			'App settings → Basic: show and copy App secret.',
			'Generate or type a Verify token HERE, then paste the SAME string into Meta → WhatsApp → Configuration → Verify token.',
			'Copy the webhook URL from this screen into Meta → WhatsApp → Configuration → Callback URL, then subscribe to the messages field.',
			'Save here, then Verify connection, then Enable.',
		],
		accessToken: 'Permanent Access Token',
		accessTokenHint:
			'From Meta Business Suite → System users → Generate token (permanent). Assign your WABA. Needs whatsapp_business_management + whatsapp_business_messaging.',
		phoneNumberId: 'Phone Number ID',
		phoneIdHint: 'From Meta Developer → WhatsApp → API Setup → Phone number ID. Copy it from Meta, do not invent it.',
		wabaId: 'WABA ID',
		wabaHint:
			'From the same API Setup page: WhatsApp Business Account ID. Not the Phone number ID.',
		verifyToken: 'Verify Token',
		verifyTokenHint:
			'You create this (or tap Generate). Then paste the same value into Meta webhook configuration. Meta does not give you this token.',
		appSecret: 'App Secret',
		appSecretHint: 'From Meta Developer → App settings → Basic → App secret → Show.',
		webhook: 'Webhook callback URL',
		webhookHint: 'Copy this URL into Meta → WhatsApp → Configuration → Callback URL, then subscribe to messages.',
		copy: 'Copy',
		copied: 'Copied',
		generateToken: 'Generate',
		leaveBlank: 'Leave blank to keep saved secret',
		savedSecret: 'Saved — leave blank to keep, or paste a new value',
		requiredMark: 'Required',
		missingRequired: 'Fill and save all required fields first',
		save: 'Save',
		validate: 'Verify connection',
		toggleOn: 'Enable',
		toggleOff: 'Disable',
		enabled: 'Enabled',
		disabled: 'Disabled',
		connected: 'Connected',
		disconnected: 'Disconnected',
		error: 'Error',
		saveOk: 'Saved — values kept in the form',
		validateOk: 'Verified',
		loadError: 'Could not load',
		sendError: 'Send failed',
		variables: 'Connection variables',
		graphVersion: 'Graph API version',
		displayPhone: 'Display phone',
		open: 'Open',
	},
	ar: {
		chats: 'المحادثات',
		search: 'بحث بالاسم أو الرقم',
		all: 'الكل',
		unread: 'غير مقروء',
		leads: 'عملاء',
		fav: 'المفضلة',
		replied: 'ردوا',
		unreplied: 'بانتظار ردك',
		window24h: '24س',
		addFavorite: 'إضافة إلى المفضلة',
		removeFavorite: 'إزالة من المفضلة',
		favoriteUpdated: 'تم تحديث المفضلة',
		favoriteFailed: 'تعذر تحديث المفضلة',
		backToChats: 'العودة للمحادثات',
		noRepliedHint: 'يظهر هنا من يرد بعد إرسال قالب ميتا لهم.',
		noUnrepliedHint: 'محادثات آخر رسالة فيها من العميل ولم ترد عليها بعد.',
		noWindowHint: 'يظهر هنا من ما زالت نافذة الـ 24 ساعة مفتوحة لديهم.',
		repliedTitle: 'أُرسل لهم قالب وردّوا',
		unrepliedTitle: 'بانتظار ردّك',
		window24hTitle: 'نافذة الـ 24 ساعة ما زالت مفتوحة',
		settings: 'إعدادات ميتا',
		phones: 'الأرقام',
		connectedPhones: 'الأرقام المتصلة',
		connectedPhonesHint: 'إدارة كل أرقام واتساب المتصلة بهذه المساحة.',
		addPhone: 'إضافة رقم',
		phoneLabelTitle: 'تسمية هذا الرقم',
		activePhone: 'الرقم النشط',
		testConnection: 'اختبار الاتصال',
		phonesNote: 'يمكن ربط عدة أرقام من نفس حساب WABA أو من حسابات مختلفة.',
		learnMore: 'اعرف المزيد',
		configuration: 'الإعدادات',
		webhooks: 'Webhooks',
		activityLog: 'سجل النشاط',
		activityEmptyTitle: 'لا يوجد نشاط بعد',
		activityEmptyHint: 'أحداث الويب هوك وتغييرات الحساب ستظهر هنا.',
		protectedByMeta: 'محمي بواسطة ميتا',
		verified: 'موثّق',
		activeBadge: 'نشط',
		displayNameLabel: 'اسم العرض',
		approvedReady: 'القوالب المعتمدة جاهزة للاستخدام',
		approvedReadyHint: 'لا يمكن إرسال إلا القوالب المعتمدة للعملاء عبر واتساب.',
		newToTemplates: 'جديد على القوالب؟',
		exploreMetaLibrary: 'استكشف مكتبة ميتا',
		templateEmptyTitle: 'لا توجد قوالب بعد',
		templateEmptyHint: 'أضف أول قالب لبدء إرسال رسائل واتساب المعتمدة.',
		templatesCrumb: 'Meta Cloud API · يُرسل فقط القوالب المعتمدة من ميتا.',
		activity: 'السجل',
		usageBilling: 'الاستهلاك والفوترة',
		usageBillingTitle: 'استهلاك وفوترة واتساب',
		usageBillingHint:
			'استهلاك حي من قاعدة البيانات + تحليلات ميتا. التكلفة تقديرية وليست الفاتورة النهائية.',
		usageRefresh: 'تحديث',
		usageSent: 'مُرسل',
		usageDelivered: 'واصل',
		usageRead: 'مقروء',
		usageFailed: 'فشل',
		usageEstimated: 'تكلفة تقديرية (هذا الشهر)',
		usageVsPrev: 'مقارنة بالشهر السابق',
		usageByCategory: 'حسب التصنيف',
		usageByCountry: 'حسب الدولة',
		usageDaily: 'يومي: عدد الرسائل والتكلفة',
		usageTemplates: 'القوالب',
		usageDisclaimer: 'تكلفة ميتا تقديرية — المبلغ النهائي قد يختلف عن فاتورة ميتا.',
		usageInvoiceNote: 'WhatsApp Manager ← Billing هو المرجع المالي النهائي.',
		usageEmpty: 'لا يوجد رقم واتساب. أضف رقماً من الإعدادات.',
		usageEmptyCta: 'إضافة رقم واتساب',
		usageLoadError: 'تعذر تحميل الاستهلاك والفوترة',
		usageMetaCost: 'تكلفة تحليلات التسعير من ميتا',
		usageSources: 'مصادر البيانات',
		usageFxRate: 'سعر التحويل',
		usageThisMonth: 'هذا الشهر',
		usageBillable: 'مفوتر (واصل)',
		usageInbound: 'وارد',
		usageCostUsd: 'دولار',
		usageCostEgp: 'ريال',
		usageCountryRates: 'أسعار القوالب حسب الدولة',
		usageSelectCountry: 'الدولة',
		usagePerMessage: 'لكل رسالة قالب واصلة',
		usageRateMarketing: 'تسويق',
		usageRateUtility: 'خدمي',
		usageRateAuth: 'مصادقة',
		usageRateService: 'خدمة',
		usageRatePerMsg: 'رسالة واحدة',
		usageRatePer100: '100 قالب',
		usageByCategoryHint: 'رسائل واصلة مفوترة هذا الشهر حسب نوع القالب. الشريط = نسبة من الإجمالي.',
		usageCatMsgs: 'رسالة',
		usageCatCost: 'تكلفة تقديرية',
		usageTplType: 'النوع',
		usageTplCost: 'التكلفة',
		backLeads: 'كشّاف العملاء',
		refresh: 'تحديث الوارد',
		sync: 'مزامنة من ميتا',
		syncHint:
			'Cloud API لا تسحب محادثات قديمة من نظام CRM آخر. المزامنة تجلب القوالب وملف الرقم من Graph؛ الرسائل تصل عبر الويب هوك أو ملف JSON رسمي من ميتا.',
		syncFromMeta: 'مزامنة من ميتا',
		syncFromMetaHint:
			'تسحب القوالب وملف الرقم/WABA واشتراك الويب هوك. Cloud API لا تنزّل محادثات قديمة من نظام CRM آخر.',
		syncCanTitle: 'متاح الآن',
		syncCannotTitle: 'غير متاح من ميتا',
		syncLocalCounts: 'مخزَّن هنا',
		syncMessagesLabel: 'رسائل',
		syncTemplatesPulled: 'قوالب هذا الـ WABA',
		syncImportJson: 'استيراد JSON ويب هوك ميتا',
		syncImportHint:
			'فقط حمولات ويب هوك ميتا الرسمية (object + entry + changes). التكرار يُتخطى بمعرّف الرسالة (wamid). ملفات CRM العامة ليست مقبولة.',
		syncImportOk: 'تم تطبيق ملف الويب هوك',
		syncingMeta: 'جاري المزامنة من ميتا…',
		closeChat: 'إغلاق المحادثة',
		copyNumber: 'نسخ الرقم',
		deletePhone: 'حذف هذا الرقم',
		deletePhoneConfirm: 'حذف رقم واتساب هذا وكل محادثاته من النظام؟ لا يمكن التراجع.',
		openPhone: 'فتح برقم',
		phonePlaceholder: 'مثال: 97433112233 أو +974 3311…',
		phoneHint: 'أدخل الرقم مع كود قطر. الرقم المحلي المكوّن من 8 أرقام يتحول تلقائيًا إلى 974…',
		phoneRequired: 'رقم الهاتف مطلوب',
		phoneInvalid: 'رقم غير صالح. استخدم كود قطر (10–15 رقم)، مثل 97433112233',
		phoneNormalized: 'سيتم الإرسال إلى',
		displayNameOptional: 'اسم العرض (اختياري)',
		cancel: 'إلغاء',
		importPhones: 'استيراد أرقام',
		importDownloadTemplate: 'تنزيل قالب Excel',
		importDownloadHint: 'صفوف تجريبية توضح أرقام قطر واسم اختياري',
		importUploadExcel: 'رفع ملف Excel بعد التعبئة',
		importUploadHint: 'يُفحص كل صف قبل فتح المحادثات',
		importReviewTitle: 'مراجعة الأرقام المستوردة',
		importReviewHint: 'يمكن حفظ الصفوف الصحيحة. عدّل الخاطئة هنا ثم احفظ.',
		importValid: 'صحيح',
		importInvalid: 'خاطئ',
		importColPhone: 'الهاتف',
		importColName: 'الاسم',
		importColStatus: 'الحالة',
		importSaveValid: 'حفظ الصفوف الصحيحة',
		importEmptyFile: 'لا توجد صفوف هواتف في هذا الملف',
		importOpened: 'تم فتح المحادثات من الصفوف الصحيحة',
		noConversations: 'لا محادثات بعد',
		noConversationsHint: 'افتح عميلاً أو رقماً، أو انتظر رسالة واردة عبر الـ Webhook.',
		emptyChat: 'اختر محادثة للبدء',
		businessAccount: 'حساب أعمال',
		encryption: 'الرسائل عبر Meta WhatsApp Cloud API.',
		metaNote: 'النص والوسائط الحرة فقط خلال نافذة 24 ساعة. خارجها استخدم قالباً معتمداً.',
		windowOpen: 'نافذة 24 ساعة مفتوحة',
		windowClosed: 'يلزم قالب',
		typeMessage: 'اكتب رسالة',
		fastReplies: 'ردود سريعة',
		fastRepliesHint: 'مقاطع محفوظة — اضغط لإدراجها في خانة الرسالة',
		fastReplySave: 'حفظ الرد',
		fastReplyTitle: 'العنوان',
		fastReplyBody: 'نص الرد',
		fastReplyAdd: 'إضافة رد جديد',
		fastReplyDelete: 'حذف',
		fastReplySaved: 'تم حفظ الرد السريع',
		fastReplyDeleted: 'تم حذف الرد السريع',
		fastReplyEmpty: 'لا توجد ردود محفوظة بعد',
		openPhoneFromChat: 'فتح المحادثة…',
		translate: 'ترجمة',
		translateToEn: 'ترجمة إلى الإنجليزية',
		translateToAr: 'ترجمة إلى العربية',
		translateHide: 'إخفاء الترجمة',
		translateFailed: 'فشلت الترجمة',
		translatedLabel: 'الترجمة',
		unsupportedMessage: 'نوع الرسالة ده غير مدعوم هنا',
		stickerUnavailable: 'الستيكر غير متاح',
		mediaUnavailable: 'الوسائط غير متاحة',
		templateName: 'اسم القالب',
		templateLang: 'اللغة',
		sendTemplate: 'إرسال قالب',
		templates: 'القوالب',
		templatesHint: 'يُرسل فقط القوالب المعتمدة من ميتا. القوالب الجديدة تحتاج مراجعة ميتا.',
		createTemplate: 'إنشاء قالب',
		addNewTemplate: 'إضافة جديد',
		seedTemplates: 'قوالب تواصل So7ba',
		seedTemplatesHint: 'معاينة قوالب عرض So7baFit ثم إرسالها لمراجعة ميتا.',
		seedSubmitSelected: 'إرسال المحدد إلى ميتا',
		seedSubmitAll: 'إرسال الكل إلى ميتا',
		seedLoad: 'تحميل معاينة القوالب',
		seedSubmitted: 'تم إرسال القوالب إلى ميتا',
		cloneAsUtility: 'استنساخ Outreach كـ UTILITY',
		cloneAsUtilityHint:
			'ينشئ so7ba_fitness_util_ar / so7ba_fitness_util_en من قوالب Outreach الحالية (MARKETING) ويرسلها لميتا.',
		cloneAsUtilityOk: 'تم إرسال نسخ UTILITY إلى ميتا',
		backToTemplates: 'العودة للقوالب',
		templateBody: 'نص الجسم',
		templateHeader: 'العنوان (اختياري)',
		templateFooter: 'التذييل (اختياري)',
		templateCategory: 'التصنيف',
		templateVarsTitle: 'املأ متغيرات القالب',
		templateNoVars: 'بدون متغيرات — إرسال مباشر',
		templatePick: 'اختر قالبًا',
		templateApprovedOnly: 'يُرسل فقط القوالب بحالة APPROVED',
		templateCreateOk: 'تم إرسال القالب لمراجعة ميتا',
		templateEditOk: 'تم إرسال تعديل القالب لمراجعة ميتا',
		editTemplate: 'تعديل القالب',
		saveTemplate: 'حفظ التعديلات',
		templateEditLocked: 'لا يمكن تغيير الاسم واللغة بعد الإنشاء',
		templateCategoryLocked: 'لا يمكن تغيير التصنيف بعد موافقة ميتا',
		templateCannotEdit: 'يُعدَّل فقط القوالب بحالة APPROVED أو REJECTED أو PAUSED',
		keepExistingSample: 'الإبقاء على عينة الوسائط الحالية — ارفع ملفًا للاستبدال',
		templateLoadError: 'تعذر تحميل القوالب من ميتا',
		templateVarRequired: 'املأ كل متغيرات القالب',
		templateUrlParamInvalid:
			'قيمة زر الرابط غير صالحة. استخدم حروف إنجليزية وأرقام ورموز الرابط فقط (مثل demo أو user/123) — بدون مسافات أو نص عربي.',
		templateUrlParamHint:
			'هذه القيمة تُكمل نهاية رابط الزر. مثال: demo أو account/abc123 — ليست رابطًا كاملًا، وليست عربي أو إيموجي.',
		templateUrlParamPlaceholder: 'مثال: demo أو user/123',
		refreshTemplates: 'تحديث القوالب',
		templatePreview: 'معاينة الرسالة',
		templateMetaDetails: 'متطلبات ميتا',
		templateAcceptTitle: 'كيف تقبل ميتا هذا القالب',
		templateAcceptSteps: [
			'يُفحص النموذج هنا أولاً حتى لا يصل لميتا محتوى غير صالح.',
			'الإرسال يرفع القالب إلى Meta Cloud API. الحالة تبدأ PENDING.',
			'ميتا تراجع الاسم واللغة والتصنيف والنص والعينات والأزرار.',
			'يُرسل للعملاء فقط القالب بحالة APPROVED. إن رفضت ميتا الطلب يبقى الخطأ هنا حتى تعدّل وتعيد الإرسال.',
		],
		templateMetaErrorHint: 'صحّح الحقول المعلّمة ثم أرسل مجدداً. النص أدناه رد ميتا.',
		templateHeaderOneVar: 'عنوان TEXT يسمح بمتغير واحد فقط: {{1}}',
		templateFooterNoVars: 'التذييل لا يجوز أن يحتوي متغيرات مثل {{1}}',
		buttonUrlHttps: 'أزرار الموقع يجب أن تبدأ بـ https://',
		buttonPhoneInvalid: 'زر الاتصال يحتاج رقماً صالحاً مع كود الدولة، مثل +97433112233',
		buttonMaxUrl: 'الحد الأقصى زرّا موقع',
		buttonMaxPhone: 'الحد الأقصى زر اتصال واحد',
		templateNameRequired: 'اسم القالب مطلوب',
		templateNameInvalid: 'استخدم حروف إنجليزية صغيرة وأرقام و _ فقط (٣ على الأقل). مثال: hello_world',
		templateLangRequired: 'اللغة مطلوبة',
		templateLangInvalid: 'استخدم كود لغة ميتا مثل en_US أو ar',
		templateCategoryInvalid: 'التصنيف يجب أن يكون UTILITY أو MARKETING أو AUTHENTICATION',
		templateBodyRequired: 'نص الجسم مطلوب',
		templateBodyTooLong: 'الحد الأقصى للجسم 1024 حرفًا',
		templateHeaderTooLong: 'الحد الأقصى للعنوان 60 حرفًا',
		templateFooterTooLong: 'الحد الأقصى للتذييل 60 حرفًا',
		templateVarsSequential: 'يجب أن تكون المتغيرات متسلسلة: {{1}} ثم {{2}} ثم {{3}}…',
		templateVarsMustBeNumbered:
			'المتغيرات يجب أن تكون أرقامًا مثل {{1}} و {{2}} — وليس {{name}} أو {{user}}',
		templateEmptyList: 'لا قوالب بعد. أضف أول قالب للبدء.',
		templateHeaderType: 'نوع العنوان',
		headerNone: 'بدون',
		headerText: 'نص',
		headerImage: 'صورة',
		headerVideo: 'فيديو',
		headerDocument: 'مستند',
		headerSampleRequired: 'ارفع ملفًا نموذجيًا لهذا النوع من العنوان',
		headerSampleHint: 'ميتا تتطلب ملف وسائط نموذجي للمراجعة (JPEG/PNG أو MP4 أو PDF)',
		uploadSample: 'رفع نموذج',
		changeSample: 'تغيير النموذج',
		templateButtons: 'الأزرار (اختياري)',
		addButton: 'إضافة زر',
		buttonType: 'النوع',
		buttonText: 'نص الزر',
		buttonUrl: 'الرابط',
		buttonPhone: 'رقم الهاتف',
		buttonQuickReply: 'رد سريع',
		buttonUrlType: 'زيارة موقع',
		buttonPhoneType: 'اتصال',
		buttonTextRequired: 'نص الزر مطلوب (حد أقصى 25 حرفًا)',
		buttonUrlRequired: 'الرابط مطلوب لأزرار الموقع',
		buttonPhoneRequired: 'رقم الهاتف مطلوب لأزرار الاتصال',
		buttonMax: 'الحد الأقصى 10 أزرار',
		insertVar: 'إدراج {{n}}',
		errorDismiss: 'إغلاق',
		metaErrorTitle: 'خطأ من واجهة ميتا',
		metaInvalidParamHint:
			'الأسباب الشائعة: استخدم {{1}} و {{2}} (وليس {{name}})؛ أزرار الرابط يجب أن تبدأ بـ https://؛ متغير زر الرابط يجب أن يكون إنجليزي/آمن للرابط (وليس عربي)؛ التذييل بدون متغيرات؛ عنوان TEXT يسمح بـ {{1}} فقط.',
		helloWorldTestOnlyHint:
			'قالب hello_world يعمل فقط من أرقام الاختبار العامة في ميتا. على رقم الأعمال الحقيقي استخدم قالب APPROVED خاص بك للتحقق.',
		metaLibrary: 'مكتبة ميتا',
		metaLibraryHint: 'تصفح قوالب ميتا الجاهزة، أضفها لحسابك، ثم أرسل رسالة تحقق لتبدأ استخدامها.',
		metaLibrarySearch: 'ابحث عن قالب…',
		metaLibraryEmpty: 'لا قوالب في المكتبة. جرّب بحثًا آخر.',
		metaLibraryLoadError: 'تعذر تحميل مكتبة قوالب ميتا',
		addFromLibrary: 'أضف لقوالبي',
		verifySend: 'تحقق وأرسل',
		verifySendTitle: 'إرسال قالب للتحقق',
		verifySendHint:
			'مثل إعدادات ميتا: اختر رقم المستلم وأرسل القالب للتحقق من التسليم.',
		verifySendOk: 'تم إرسال قالب التحقق',
		libraryAdded: 'تم إرسال قالب المكتبة لمراجعة ميتا',
		verificationTemplates: 'التحقق / نماذج',
		templateColName: 'الاسم',
		templateColLanguage: 'اللغة',
		templateColCategory: 'التصنيف',
		templateColStatus: 'الحالة',
		templateColHeader: 'العنوان',
		templateColActions: 'إجراءات',
		templateShow: 'عرض',
		templateUse: 'استخدام',
		templateEdit: 'تعديل',
		templateDelete: 'حذف',
		templateCopy: 'نسخ',
		templateCopyName: 'نسخ الاسم',
		templateCopied: 'تم نسخ اسم القالب',
		templateDeleteConfirm: 'حذف هذا القالب من ميتا؟ لا يمكن التراجع.',
		templateDeleted: 'تم حذف القالب من ميتا',
		templatePreviewTitle: 'معاينة القالب',
		recording: 'جاري التسجيل',
		recordingHint: 'إيقاف مؤقت أو إيقاف أو إرسال · سلة للإلغاء',
		recordingCancel: 'إلغاء',
		recordingSend: 'إرسال الصوت',
		recordingPause: 'إيقاف مؤقت',
		recordingResume: 'استئناف',
		recordingStop: 'إيقاف',
		recordingReady: 'المقطع جاهز',
		recordingReadyHint: 'اضغط إرسال للتسليم · سلة للحذف',
		configTitle: 'إعدادات ميتا واتساب',
		configSubtitle: 'الصق بيانات تطبيقك من ميتا. لا نعبّئ الحقول نيابة عنك.',
		configHelpAria: 'كيف تحصل على هذه القيم من ميتا',
		configHelpTitle: 'احصل على هذه القيم من ميتا — وليست من حساب QSC آخر',
		configHelpIntro:
			'كل جيم يستخدم واتساب كلاود الخاص به. افتح Meta Developer Console وانسخ القيم أدناه.',
		configHelpOpenConsole: 'فتح Meta Developer Console',
		configGuideTabApp: 'التطبيق',
		configGuideTabIds: 'المعرّفات',
		configGuideTabTokens: 'الرموز',
		configGuideTabWebhook: 'الويب هوك',
		configGuideTitleApp: 'أنشئ تطبيق ميتا',
		configGuideWhyApp:
			'معرّف رقم الهاتف وWABA يأتيان من منتج واتساب في تطبيقك — وليس من جيم QSC آخر.',
		configGuideTitleIds: 'انسخ المعرّفين',
		configGuideWhyIds: 'Phone number ID و WhatsApp Business Account ID رقمان مختلفان في نفس صفحة API Setup.',
		configGuideTitleTokens: 'التوكن الدائم وسر التطبيق ورمز التحقق',
		configGuideWhyTokens:
			'ميتا تصدر توكن الوصول وسر التطبيق. أنت تنشئ رمز تحقق الويب هوك هنا ثم تلصق نفس النص في ميتا.',
		configGuideTitleWebhook: 'رابط الـ Callback ثم الحفظ والتفعيل',
		configGuideWhyWebhook:
			'الرسائل الواردة تصل فقط بعد لصق رابط الـ Callback في ميتا والاشتراك في حقل messages.',
		configHelpSteps: [
			'أنشئ أو افتح تطبيقك من developers.facebook.com/apps ثم أضف منتج WhatsApp.',
			'WhatsApp ← API Setup: انسخ Phone number ID و WhatsApp Business Account ID (WABA). رقمان مختلفان.',
			'Meta Business Suite ← إعدادات النشاط ← المستخدمون ← مستخدمو النظام: أنشئ توكن دائمًا بصلاحيات whatsapp_business_management و whatsapp_business_messaging، وعيّن WABA الخاص بك.',
			'إعدادات التطبيق ← Basic: أظهر وانسخ App secret.',
			'أنشئ Verify token هنا (أو اضغط توليد)، ثم الصق نفس القيمة في ميتا ← WhatsApp ← Configuration ← Verify token.',
			'انسخ رابط الـ Webhook من هذه الشاشة إلى ميتا ← Callback URL، ثم اشترك في حقل messages.',
			'احفظ هنا، ثم تحقق من الاتصال، ثم فعّل التكامل.',
		],
		accessToken: 'رمز الوصول الدائم',
		accessTokenHint:
			'من Meta Business Suite ← مستخدمو النظام ← Generate token (دائم). عيّن WABA الخاص بك. يحتاج whatsapp_business_management و whatsapp_business_messaging.',
		phoneNumberId: 'معرّف رقم الهاتف',
		phoneIdHint: 'من Meta Developer ← WhatsApp ← API Setup ← Phone number ID. انسخه من ميتا ولا تخترعه.',
		wabaId: 'معرّف WABA',
		wabaHint:
			'من نفس صفحة API Setup: WhatsApp Business Account ID. ليس معرّف رقم الهاتف.',
		verifyToken: 'رمز التحقق',
		verifyTokenHint:
			'أنت تنشئه هنا (أو توليد). ثم تلصق نفس القيمة في إعداد Webhook داخل ميتا. ميتا لا تعطيك هذا الرمز.',
		appSecret: 'سر التطبيق',
		appSecretHint: 'من Meta Developer ← App settings ← Basic ← App secret ← Show.',
		webhook: 'رابط الـ Webhook',
		webhookHint: 'انسخ هذا الرابط إلى ميتا ← WhatsApp ← Configuration ← Callback URL ثم اشترك في messages.',
		copy: 'نسخ',
		copied: 'تم النسخ',
		generateToken: 'توليد',
		leaveBlank: 'اتركه فارغًا للإبقاء على السر',
		savedSecret: 'محفوظ — اتركه فارغًا للإبقاء، أو الصق قيمة جديدة',
		requiredMark: 'مطلوب',
		missingRequired: 'املأ واحفظ كل الحقول المطلوبة أولاً',
		save: 'حفظ',
		validate: 'تحقق',
		toggleOn: 'تفعيل',
		toggleOff: 'تعطيل',
		enabled: 'مفعّل',
		disabled: 'معطّل',
		connected: 'متصل',
		disconnected: 'غير متصل',
		error: 'خطأ',
		saveOk: 'تم الحفظ — القيم ما زالت في النموذج',
		validateOk: 'تم التحقق',
		loadError: 'تعذر التحميل',
		sendError: 'فشل الإرسال',
		variables: 'متغيرات الاتصال',
		graphVersion: 'إصدار Graph',
		displayPhone: 'رقم العرض',
		open: 'فتح',
	},
};

function initials(name = '') {
	const parts = String(name).trim().split(/\s+/).filter(Boolean);
	if (!parts.length) return '?';
	return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function formatTime(value, locale) {
	if (!value) return '';
	try {
		return new Date(value).toLocaleTimeString(locale === 'ar' ? 'ar' : 'en', {
			hour: '2-digit',
			minute: '2-digit',
		});
	} catch {
		return '';
	}
}

const CUSTOMER_CARE_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Newest sane message timestamp in ms. Handles unix-seconds mistakes. */
function bestMessageTimestampMs(...values) {
	let best = 0;
	for (const value of values) {
		if (value == null || value === '') continue;
		let ms = new Date(value).getTime();
		if (!Number.isFinite(ms)) continue;
		if (ms > 0 && ms < 1e11) ms *= 1000;
		if (ms < 1e12) continue;
		if (ms > best) best = ms;
	}
	return best;
}

function isOutboundMessage(m) {
	return String(m?.direction || '').toLowerCase() === 'outbound';
}

/**
 * 24h window = time since the customer's latest message (not ours).
 * Matches left-side bubbles: anything that is not outbound counts as client-side.
 */
function hasOpenCustomerCareWindow(messages, active) {
	if (active?.canSendFreeform === true || active?.withinCustomerCareWindow === true) return true;

	const now = Date.now();
	let latestClientTs = bestMessageTimestampMs(active?.lastInboundAt);

	for (const m of messages || []) {
		if (isOutboundMessage(m)) continue;
		const ts = bestMessageTimestampMs(m.createdAt, m.providerTimestamp);
		if (ts > latestClientTs) latestClientTs = ts;
	}

	return Boolean(latestClientTs && now - latestClientTs <= CUSTOMER_CARE_WINDOW_MS);
}

function normalizeMessagesPayload(raw) {
	if (Array.isArray(raw)) {
		return { messages: raw, care: null };
	}
	if (raw && typeof raw === 'object') {
		const messages = Array.isArray(raw.messages) ? raw.messages : [];
		return {
			messages,
			care: {
				canSendFreeform: Boolean(raw.canSendFreeform ?? raw.withinCustomerCareWindow),
				withinCustomerCareWindow: Boolean(raw.withinCustomerCareWindow ?? raw.canSendFreeform),
				requiresTemplate: Boolean(raw.requiresTemplate ?? !(raw.canSendFreeform ?? raw.withinCustomerCareWindow)),
				lastInboundAt: raw.lastInboundAt || null,
				customerCareRemainingMs: Number(raw.customerCareRemainingMs) || 0,
			},
		};
	}
	return { messages: [], care: null };
}

function mergeConversationCare(conv, care, messages) {
	const open =
		care?.canSendFreeform === true ||
		hasOpenCustomerCareWindow(messages, conv);
	if (!conv) return conv;
	return {
		...conv,
		...(care?.lastInboundAt ? { lastInboundAt: care.lastInboundAt } : {}),
		canSendFreeform: open,
		withinCustomerCareWindow: open,
		requiresTemplate: !open,
		customerCareRemainingMs:
			care?.customerCareRemainingMs ?? conv.customerCareRemainingMs,
	};
}

function randomVerifyToken() {
	const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let out = 'so7ba_';
	for (let i = 0; i < 28; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
	return out;
}

/** Match backend normalizeWaId — E.164 digits without +. Qatar local 8-digit → 974. */
function normalizeWaPhone(phone) {
	if (!phone) return null;
	let digits = String(phone).trim().replace(/\D/g, '');
	if (!digits) return null;
	if (digits.startsWith('00')) digits = digits.slice(2);
	if (/^[34567]\d{7}$/.test(digits)) digits = `974${digits}`;
	if (digits.startsWith('0')) return null;
	if (digits.length < 10 || digits.length > 15) return null;
	return digits;
}

function parsePlaceholdersInText(text, component) {
	if (!text) return [];
	const named = [...String(text).matchAll(/\{\{\s*([a-zA-Z_][\w]*)\s*\}\}/g)];
	if (named.length) {
		const seen = new Set();
		return named
			.map(m => m[1])
			.filter(k => {
				if (seen.has(k)) return false;
				seen.add(k);
				return true;
			})
			.map(key => ({
				component,
				format: 'named',
				key,
				id: `${component}:named:${key}`,
				label: `${component} · ${key}`,
			}));
	}
	const nums = [
		...new Set(
			[...String(text).matchAll(/\{\{\s*(\d+)\s*\}\}/g)].map(m => Number(m[1])),
		),
	].sort((a, b) => a - b);
	return nums.map(n => ({
		component,
		format: 'positional',
		key: String(n),
		index: n,
		id: `${component}:pos:${n}`,
		label: `${component} · {{${n}}}`,
	}));
}

function extractTemplatePlaceholders(components = []) {
	const out = [];
	for (const c of components || []) {
		const type = String(c.type || '').toUpperCase();
		if (type === 'BODY' || type === 'HEADER') {
			out.push(...parsePlaceholdersInText(c.text, type));
		}
		if (type === 'BUTTONS' && Array.isArray(c.buttons)) {
			c.buttons.forEach((btn, index) => {
				if (String(btn.type || '').toUpperCase() !== 'URL') return;
				const vars = parsePlaceholdersInText(btn.url, 'BUTTON');
				vars.forEach(v => {
					out.push({
						...v,
						component: 'BUTTON',
						buttonIndex: index,
						urlTemplate: String(btn.url || ''),
						id: `BUTTON:${index}:${v.key}`,
						label: `Button ${index + 1} URL · {{${v.key}}}`,
					});
				});
			});
		}
	}
	return out;
}

/** Meta var(--shell-ink): dynamic URL button suffix must form a valid https URL. */
const URL_BUTTON_PARAM_SAFE = /^[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+$/;

function isValidUrlButtonParam(value, urlTemplate = '') {
	const param = String(value || '').trim();
	if (!param) return false;
	if (/\s/.test(param)) return false;
	if (/[^\x00-\x7F]/.test(param)) return false; // no Arabic / emoji / non-ASCII
	if (!URL_BUTTON_PARAM_SAFE.test(param)) return false;
	if (!urlTemplate) return true;
	const filled = String(urlTemplate).replace(/\{\{\s*[\w]+\s*\}\}/g, () => param);
	try {
		const u = new URL(filled);
		return /^https?:$/i.test(u.protocol);
	} catch {
		return false;
	}
}

function validateTemplateSendValues(placeholders, values, t) {
	const fieldErrors = {};
	for (const p of placeholders || []) {
		const text = String(values[p.id] || '').trim();
		if (!text) {
			fieldErrors[p.id] = t.templateVarRequired;
			continue;
		}
		if (p.component === 'BUTTON' && !isValidUrlButtonParam(text, p.urlTemplate)) {
			fieldErrors[p.id] = t.templateUrlParamInvalid;
		}
	}
	return fieldErrors;
}

function buildTemplateSendComponents(placeholders, values) {
	if (!placeholders.length) return undefined;
	const bodyParams = [];
	const headerParams = [];
	const buttonGroups = {};

	for (const p of placeholders) {
		const text = String(values[p.id] || '').trim();
		if (!text) continue;
		if (p.component === 'BODY') {
			bodyParams.push(
				p.format === 'named'
					? { type: 'text', parameter_name: p.key, text, _index: p.index || 0 }
					: { type: 'text', text, _index: p.index || 0 },
			);
		} else if (p.component === 'HEADER') {
			headerParams.push(
				p.format === 'named'
					? { type: 'text', parameter_name: p.key, text, _index: p.index || 0 }
					: { type: 'text', text, _index: p.index || 0 },
			);
		} else if (p.component === 'BUTTON') {
			const idx = String(p.buttonIndex ?? 0);
			if (!buttonGroups[idx]) buttonGroups[idx] = [];
			buttonGroups[idx].push({ type: 'text', text });
		}
	}

	const components = [];
	if (headerParams.length) {
		headerParams.sort((a, b) => (a._index || 0) - (b._index || 0));
		components.push({
			type: 'header',
			parameters: headerParams.map(({ type, text, parameter_name }) =>
				parameter_name ? { type, text, parameter_name } : { type, text },
			),
		});
	}
	if (bodyParams.length) {
		bodyParams.sort((a, b) => (a._index || 0) - (b._index || 0));
		components.push({
			type: 'body',
			parameters: bodyParams.map(({ type, text, parameter_name }) =>
				parameter_name ? { type, text, parameter_name } : { type, text },
			),
		});
	}
	Object.keys(buttonGroups)
		.sort((a, b) => Number(a) - Number(b))
		.forEach(index => {
			components.push({
				type: 'button',
				sub_type: 'url',
				index,
				parameters: buttonGroups[index],
			});
		});
	return components.length ? components : undefined;
}

function templatePreviewText(components = []) {
	const body = (components || []).find(c => String(c.type || '').toUpperCase() === 'BODY');
	return body?.text || '';
}

function templateHeaderText(components = []) {
	const header = (components || []).find(c => String(c.type || '').toUpperCase() === 'HEADER');
	return header?.text || '';
}

function templateHeaderFormat(components = []) {
	const header = (components || []).find(c => String(c.type || '').toUpperCase() === 'HEADER');
	return String(header?.format || (header?.text ? 'TEXT' : '')).toUpperCase();
}

function templateFooterText(components = []) {
	const footer = (components || []).find(c => String(c.type || '').toUpperCase() === 'FOOTER');
	return footer?.text || '';
}

function templateButtons(components = []) {
	const block = (components || []).find(c => String(c.type || '').toUpperCase() === 'BUTTONS');
	return Array.isArray(block?.buttons) ? block.buttons : [];
}

function templateHeaderComponent(components = []) {
	return (components || []).find(c => String(c.type || '').toUpperCase() === 'HEADER') || null;
}

function canEditMetaTemplate(tpl) {
	const status = String(tpl?.status || '').toUpperCase();
	return ['APPROVED', 'REJECTED', 'PAUSED'].includes(status) && Boolean(tpl?.id);
}

function formFromMetaTemplate(tpl, isAr) {
	const headerFormat = templateHeaderFormat(tpl?.components) || 'NONE';
	const buttons = templateButtons(tpl?.components).map(b => ({
		id: nextButtonId(),
		type: String(b.type || 'QUICK_REPLY').toUpperCase(),
		text: String(b.text || ''),
		url: String(b.url || ''),
		phone_number: String(b.phone_number || ''),
	}));
	return {
		name: String(tpl?.name || ''),
		language: String(tpl?.language || (isAr ? 'ar' : 'en_US')),
		category: String(tpl?.category || 'UTILITY').toUpperCase(),
		headerFormat: ['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat)
			? headerFormat
			: 'NONE',
		headerText: templateHeaderText(tpl?.components),
		bodyText: templatePreviewText(tpl?.components),
		footerText: templateFooterText(tpl?.components),
		buttons,
	};
}

function emptyCreateTemplateForm(isAr) {
	return {
		name: '',
		language: isAr ? 'ar' : 'en_US',
		category: 'UTILITY',
		headerFormat: 'NONE',
		headerText: '',
		bodyText: '',
		footerText: '',
		buttons: [],
	};
}

function nextButtonId() {
	return `btn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function assertNumberedVars(text, fieldKey, errors, t) {
	const matches = [...String(text || '').matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)];
	if (!matches.length) return;
	for (const m of matches) {
		if (!/^\d+$/.test(String(m[1]).trim())) {
			errors[fieldKey] = t.templateVarsMustBeNumbered;
			return;
		}
	}
	const positional = matches.map(m => Number(m[1]));
	const unique = [...new Set(positional)].sort((a, b) => a - b);
	for (let i = 0; i < unique.length; i += 1) {
		if (unique[i] !== i + 1) {
			errors[fieldKey] = t.templateVarsSequential;
			return;
		}
	}
}

function fillTemplatePlaceholders(text, sendComponents, componentType = 'body') {
	if (!text) return '';
	const list = unwrapTemplateSendComponents(sendComponents);
	const send = list.find(
		c => String(c.type || '').toLowerCase() === componentType.toLowerCase(),
	);
	const params = send?.parameters || [];
	return String(text)
		.replace(/\{\{\s*(\d+)\s*\}\}/g, (_m, n) => {
			const idx = Number(n) - 1;
			return params[idx]?.text != null ? String(params[idx].text) : `{{${n}}}`;
		})
		.replace(/\{\{\s*([a-zA-Z_][\w]*)\s*\}\}/g, (_m, name) => {
			const hit = params.find(p => p?.parameter_name === name);
			return hit?.text != null ? String(hit.text) : `{{${name}}}`;
		});
}

function unwrapTemplateSendComponents(stored) {
	if (Array.isArray(stored)) return stored;
	if (stored && Array.isArray(stored.send)) return stored.send;
	if (stored && Array.isArray(stored.parameters)) return stored.parameters;
	return [];
}

function unwrapStoredTemplateButtons(stored) {
	if (stored && Array.isArray(stored.buttons)) return stored.buttons;
	return [];
}

function resolveTemplateButtons(defComponents, sendComponents) {
	const buttons = templateButtons(defComponents);
	if (!buttons.length) return [];
	const send = unwrapTemplateSendComponents(sendComponents);
	const urlSends = send.filter(
		c =>
			String(c?.type || '').toLowerCase() === 'button' &&
			String(c?.sub_type || '').toLowerCase() === 'url',
	);
	return buttons.map((btn, index) => {
		const type = String(btn?.type || 'QUICK_REPLY').toUpperCase();
		const text = String(btn?.text || '').trim();
		let url = String(btn?.url || '').trim();
		const phone_number = String(btn?.phone_number || '').trim();
		if (type === 'URL' && url.includes('{{')) {
			const sendBtn =
				urlSends.find(s => Number(s.index ?? -1) === index) || urlSends[0];
			const param = String(sendBtn?.parameters?.[0]?.text || '').trim();
			if (param) url = url.replace(/\{\{\s*[\w]+\s*\}\}/g, () => param);
		}
		return { type, text, url, phone_number };
	});
}

const URL_IN_TEXT_RE =
	/((?:https?:\/\/|www\.)[^\s<]+[^\s<.,:;!?"')\]\}])/gi;

/** Candidate phone-like spans (normalized later). */
const PHONE_IN_TEXT_RE = /(?:\+?\d[\d\s\-().]{6,22}\d)/g;

function splitTextWithRichParts(text) {
	const raw = String(text || '');
	if (!raw) return [];

	const hits = [];

	const urlRe = new RegExp(URL_IN_TEXT_RE.source, 'gi');
	let match;
	while ((match = urlRe.exec(raw)) !== null) {
		const value = match[0];
		const href = /^www\./i.test(value) ? `https://${value}` : value;
		hits.push({ type: 'link', value, href, start: match.index, end: match.index + value.length });
	}

	const phoneRe = new RegExp(PHONE_IN_TEXT_RE.source, 'g');
	while ((match = phoneRe.exec(raw)) !== null) {
		const value = match[0];
		const waId = normalizeWaPhone(value);
		if (!waId) continue;
		hits.push({
			type: 'phone',
			value,
			waId,
			start: match.index,
			end: match.index + value.length,
		});
	}

	hits.sort((a, b) => a.start - b.start || b.end - a.start - (a.end - a.start));
	const picked = [];
	let cursor = 0;
	for (const hit of hits) {
		if (hit.start < cursor) continue;
		picked.push(hit);
		cursor = hit.end;
	}

	const parts = [];
	let last = 0;
	for (const hit of picked) {
		if (hit.start > last) parts.push({ type: 'text', value: raw.slice(last, hit.start) });
		parts.push(hit);
		last = hit.end;
	}
	if (last < raw.length) parts.push({ type: 'text', value: raw.slice(last) });
	return parts.length ? parts : [{ type: 'text', value: raw }];
}

function RichMessageText({ text, className = '', onPhoneClick }) {
	const parts = splitTextWithRichParts(text);
	return (
		<span className={className}>
			{parts.map((p, i) => {
				if (p.type === 'link') {
					return (
						<a
							key={`l-${i}`}
							href={p.href}
							target="_blank"
							rel="noopener noreferrer"
							className="break-all font-semibold underline underline-offset-2"
							style={{ color: 'var(--shell-blue)' }}
							onClick={e => e.stopPropagation()}
						>
							{p.value}
						</a>
					);
				}
				if (p.type === 'phone') {
					return (
						<button
							key={`p-${i}`}
							type="button"
							className="inline break-all font-semibold underline underline-offset-2"
							style={{ color: 'var(--shell-blue)' }}
							title={p.waId}
							onClick={e => {
								e.preventDefault();
								e.stopPropagation();
								onPhoneClick?.(p.waId, p.value);
							}}
						>
							{p.value}
						</button>
					);
				}
				return <span key={`t-${i}`}>{p.value}</span>;
			})}
		</span>
	);
}

function resolveTemplateMessageParts(message, templates = []) {
	if (!message) return { header: '', body: '', footer: '', buttons: [] };
	const send = unwrapTemplateSendComponents(message.templateComponents);
	const storedButtons = unwrapStoredTemplateButtons(message.templateComponents);
	const tpl =
		templates.find(
			t =>
				t.name === message.templateName &&
				(!message.templateLanguage || t.language === message.templateLanguage),
		) || templates.find(t => t.name === message.templateName);

	let header = '';
	let body = '';
	let footer = '';
	if (tpl?.components?.length) {
		header = fillTemplatePlaceholders(
			templateHeaderText(tpl.components),
			send,
			'header',
		);
		body = fillTemplatePlaceholders(templatePreviewText(tpl.components), send, 'body');
		footer = templateFooterText(tpl.components);
	}

	const raw = String(message.body || '');
	if (!body) {
		if (raw && !raw.startsWith('[template:')) body = raw;
		else body = message.templateName || raw.replace(/^\[template:(.*)\]$/, '$1');
	} else if (!header && !footer && raw && !raw.startsWith('[template:') && raw !== body) {
		// Prefer structured body; keep raw only when structure missing
	}

	const buttons = storedButtons.length
		? storedButtons
		: resolveTemplateButtons(tpl?.components, send);

	return { header, body, footer, buttons };
}

function renderTemplateMessageDisplay(message, templates = []) {
	if (!message) return '';
	if (message.messageType !== 'template') return message.body || '';
	const parts = resolveTemplateMessageParts(message, templates);
	return [parts.header, parts.body, parts.footer].filter(Boolean).join('\n');
}

function TemplateActionButtons({ buttons }) {
	const list = Array.isArray(buttons) ? buttons.filter(b => b?.text) : [];
	if (!list.length) return null;
	return (
		<div className="mt-1 overflow-hidden rounded-b-[10px] border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
			{list.map((btn, i) => {
				const type = String(btn.type || '').toUpperCase();
				const text = String(btn.text || 'Button');
				const url = String(btn.url || '').trim();
				const phone = String(btn.phone_number || '').trim();
				const className =
					'flex w-full items-center justify-center gap-1.5 border-t px-3 py-2.5 text-[13px] font-semibold transition hover:bg-[var(--color-surface-soft)]';
				const style = {
					borderColor: i === 0 ? 'transparent' : 'rgba(0,0,0,0.06)',
					color: 'var(--shell-blue)',
				};
				const icon =
					type === 'URL' ? (
						<Link2 className="h-3.5 w-3.5 shrink-0" />
					) : type === 'PHONE_NUMBER' ? (
						<PubIcon src={PUB.phone} className="h-3.5 w-3.5 shrink-0 object-contain" />
					) : type === 'QUICK_REPLY' ? (
						<MessageCircle className="h-3.5 w-3.5 shrink-0" />
					) : null;

				if (type === 'URL' && url) {
					return (
						<a
							key={`${text}-${i}`}
							href={url}
							target="_blank"
							rel="noopener noreferrer"
							className={className}
							style={style}
							onClick={e => e.stopPropagation()}
						>
							{icon}
							<span className="truncate">{text}</span>
						</a>
					);
				}
				if (type === 'PHONE_NUMBER' && phone) {
					return (
						<a
							key={`${text}-${i}`}
							href={`tel:${phone.replace(/\s+/g, '')}`}
							className={className}
							style={style}
							onClick={e => e.stopPropagation()}
						>
							{icon}
							<span className="truncate">{text}</span>
						</a>
					);
				}
				return (
					<div key={`${text}-${i}`} className={className} style={style}>
						{icon}
						<span className="truncate">{text}</span>
					</div>
				);
			})}
		</div>
	);
}

function exampleParamsFromText(text) {
	const nums = [
		...new Set(
			[...String(text || '').matchAll(/\{\{\s*(\d+)\s*\}\}/g)].map(m => Number(m[1])),
		),
	].sort((a, b) => a - b);
	const samples = ['Ahmed', 'Cairo', 'So7baFit', '12345', 'today'];
	if (nums.length) return nums.map(n => samples[(n - 1) % samples.length]);
	return [];
}

const META_TEMPLATE_LANGUAGES = [
	{ value: 'en_US', label: 'English (US) — en_US' },
	{ value: 'en', label: 'English — en' },
	{ value: 'ar', label: 'Arabic — ar' },
	{ value: 'ar_AR', label: 'Arabic — ar_AR' },
	{ value: 'fr', label: 'French — fr' },
	{ value: 'es', label: 'Spanish — es' },
	{ value: 'pt_BR', label: 'Portuguese (BR) — pt_BR' },
	{ value: 'hi', label: 'Hindi — hi' },
	{ value: 'id', label: 'Indonesian — id' },
	{ value: 'tr', label: 'Turkish — tr' },
];

const META_TEMPLATE_CATEGORIES = [
	{ value: 'UTILITY', label: 'UTILITY' },
	{ value: 'MARKETING', label: 'MARKETING' },
	{ value: 'AUTHENTICATION', label: 'AUTHENTICATION' },
];

function validateCreateTemplateForm(form, t, opts = {}) {
	const errors = {};
	const name = String(form.name || '').trim().toLowerCase();
	if (!name) errors.name = t.templateNameRequired;
	else if (!/^[a-z0-9_]{3,512}$/.test(name)) errors.name = t.templateNameInvalid;
	else if (/__/.test(name) || name.startsWith('_') || name.endsWith('_')) {
		errors.name = t.templateNameInvalid;
	}

	const language = String(form.language || '').trim();
	if (!language) errors.language = t.templateLangRequired;
	else if (!/^[a-z]{2}(_[A-Z]{2})?$/.test(language) && !/^[a-z]{2}$/.test(language)) {
		errors.language = t.templateLangInvalid;
	}

	const category = String(form.category || '').toUpperCase();
	if (!['UTILITY', 'MARKETING', 'AUTHENTICATION'].includes(category)) {
		errors.category = t.templateCategoryInvalid;
	}

	const body = String(form.bodyText || '').trim();
	if (!body) errors.bodyText = t.templateBodyRequired;
	else if (body.length > 1024) errors.bodyText = t.templateBodyTooLong;
	else assertNumberedVars(body, 'bodyText', errors, t);

	const headerFormat = String(form.headerFormat || 'NONE').toUpperCase();
	if (headerFormat === 'TEXT') {
		const header = String(form.headerText || '').trim();
		if (header.length > 60) errors.headerText = t.templateHeaderTooLong;
		else {
			assertNumberedVars(header, 'headerText', errors, t);
			const headerVars = [...new Set([...header.matchAll(/\{\{\s*(\d+)\s*\}\}/g)].map(m => Number(m[1])))];
			if (!errors.headerText && headerVars.length > 1) {
				errors.headerText = t.templateHeaderOneVar;
			}
		}
	} else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat)) {
		if (!opts.hasHeaderSample && !form.headerHandle) {
			errors.headerSample = t.headerSampleRequired;
		}
	}

	const footer = String(form.footerText || '').trim();
	if (footer.length > 60) errors.footerText = t.templateFooterTooLong;
	else if (/\{\{/.test(footer)) errors.footerText = t.templateFooterNoVars;

	const buttons = Array.isArray(form.buttons) ? form.buttons : [];
	if (buttons.length > 10) errors.buttons = t.buttonMax;
	const urlCount = buttons.filter(b => String(b.type || '').toUpperCase() === 'URL').length;
	const phoneCount = buttons.filter(b => String(b.type || '').toUpperCase() === 'PHONE_NUMBER').length;
	if (urlCount > 2) errors.buttons = t.buttonMaxUrl;
	if (phoneCount > 1) errors.buttons = t.buttonMaxPhone;
	buttons.forEach((btn, idx) => {
		const text = String(btn.text || '').trim();
		if (!text || text.length > 25) {
			errors[`button_${idx}_text`] = t.buttonTextRequired;
		}
		const type = String(btn.type || '').toUpperCase();
		if (type === 'URL') {
			const url = String(btn.url || '').trim();
			if (!url) errors[`button_${idx}_url`] = t.buttonUrlRequired;
			else if (!/^https:\/\//i.test(url)) errors[`button_${idx}_url`] = t.buttonUrlHttps;
			else assertNumberedVars(url, `button_${idx}_url`, errors, t);
		}
		if (type === 'PHONE_NUMBER') {
			const phone = String(btn.phone_number || '').trim();
			if (!phone) errors[`button_${idx}_phone`] = t.buttonPhoneRequired;
			else if ((phone.replace(/\D/g, '').length < 8)) {
				errors[`button_${idx}_phone`] = t.buttonPhoneInvalid;
			}
		}
	});

	return errors;
}

function mapMetaTemplateErrorToFields(message, t) {
	const raw = String(message || '').trim();
	if (!raw) return {};
	const m = raw.toLowerCase();
	const errors = { form: raw };
	if (/template name|name must|already exists/.test(m)) errors.name = raw;
	if (/language/.test(m)) errors.language = raw;
	if (/category/.test(m)) errors.category = raw;
	if (/header/.test(m) && /sample|image|video|document|media/.test(m)) errors.headerSample = raw;
	else if (/header/.test(m)) errors.headerText = raw;
	if (/body|placeholder|parameter|variable/.test(m)) errors.bodyText = raw;
	if (/footer/.test(m)) errors.footerText = raw;
	if (/button|url|phone/.test(m)) errors.buttons = raw;
	if (/invalid parameter/i.test(raw) && t.metaInvalidParamHint) {
		errors.form = `${raw}\n${t.metaInvalidParamHint}`;
	}
	return errors;
}

function resolveWebhookUrl(status) {
	const fromApi = status?.webhookCallbackUrl || status?.webhookUrlHint || status?.webhookPath || '/api/whatsapp/webhook';
	if (/^https?:\/\//i.test(fromApi)) return fromApi;
	const apiBase = String(import.meta.env.VITE_API_BASE || 'http://localhost:5001/api').replace(/\/$/, '');
	const origin = apiBase.replace(/\/api$/, '');
	const path = fromApi.startsWith('/') ? fromApi : `/${fromApi}`;
	return `${origin}${path}`;
}

function emptyConfigForm() {
	return {
		accessToken: '',
		phoneNumberId: '',
		wabaId: '',
		verifyToken: randomVerifyToken(),
		appSecret: '',
	};
}

function formFromServerStatus(server) {
	return {
		accessToken: server?.accessToken || '',
		appSecret: server?.appSecret || '',
		phoneNumberId: server?.phoneNumberId || '',
		wabaId: server?.wabaId || '',
		verifyToken: server?.verifyToken || '',
	};
}

function configGuideTabs(t) {
	const steps = Array.isArray(t.configHelpSteps) ? t.configHelpSteps : [];
	return [
		{
			id: 'app',
			label: t.configGuideTabApp,
			title: t.configGuideTitleApp,
			why: t.configGuideWhyApp,
			steps: steps.slice(0, 1),
		},
		{
			id: 'ids',
			label: t.configGuideTabIds,
			title: t.configGuideTitleIds,
			why: t.configGuideWhyIds,
			steps: steps.slice(1, 2),
		},
		{
			id: 'tokens',
			label: t.configGuideTabTokens,
			title: t.configGuideTitleTokens,
			why: t.configGuideWhyTokens,
			steps: steps.slice(2, 5),
		},
		{
			id: 'webhook',
			label: t.configGuideTabWebhook,
			title: t.configGuideTitleWebhook,
			why: t.configGuideWhyWebhook,
			steps: steps.slice(5),
		},
	];
}

function ConfigSetupGuide({ t }) {
	const tabs = configGuideTabs(t);
	const [tab, setTab] = useState(tabs[0]?.id || 'app');
	const active = tabs.find(item => item.id === tab) || tabs[0];
	return (
		<div className="rounded-[16px] border border-[var(--color-primary-soft)] bg-[color-mix(in_srgb,var(--color-primary-soft)_55%,var(--color-surface-elevated))] p-4">
			<div className="flex flex-wrap items-center gap-3">
				<img src={PUB.whatsappLogo} alt="" className="h-10 w-10 shrink-0 object-contain" />
				<div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
					{tabs.map(item => (
						<button
							key={item.id}
							type="button"
							onClick={() => setTab(item.id)}
							className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${
								item.id === active?.id
									? 'bg-[var(--shell-blue)] text-white shadow-[0_4px_12px_color-mix(in_srgb,var(--shell-blue)_28%,transparent)]'
									: 'bg-[var(--color-surface-elevated)] text-[var(--shell-muted)] hover:text-[var(--shell-ink)]'
							}`}
						>
							{item.label}
						</button>
					))}
				</div>
				<a
					href="https://developers.facebook.com/apps/"
					target="_blank"
					rel="noreferrer"
					className="shrink-0 text-[11px] font-bold text-[var(--shell-blue)]"
				>
					{t.configHelpOpenConsole}
				</a>
			</div>
			{active ? (
				<div className="mt-4 rounded-[12px] border border-[var(--shell-line)] bg-[var(--color-surface-elevated)] px-4 py-3">
					<p className="text-[13px] font-bold text-[var(--shell-ink)]">{active.title}</p>
					<p className="mt-1 text-[12px] leading-relaxed text-[var(--shell-muted)]">{active.why}</p>
					<ol className="mt-3 list-decimal space-y-2 ps-5 text-[12px] leading-relaxed text-[var(--shell-ink)]">
						{active.steps.map(step => (
							<li key={step}>{step}</li>
						))}
					</ol>
				</div>
			) : null}
		</div>
	);
}

function EmptyHero({ icon, title, hint, children }) {
	return (
		<div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
			<PubIcon src={icon} className="h-[220px] w-[220px] max-h-[40vh] max-w-full object-contain" />
			<h2 className="mt-6 text-[22px] font-bold tracking-tight text-[var(--shell-ink)]">{title}</h2>
			<p className="mt-2 max-w-[420px] text-[14px] leading-6 text-[var(--shell-muted)]">{hint}</p>
			{children}
		</div>
	);
}

function TemplatePhonePreview({ t, createForm, headerSampleFile, headerSamplePreview }) {
	const buttons = (createForm.buttons || []).filter(b => String(b.text || '').trim());
	return (
		<div className="flex min-h-0 flex-col items-center gap-3 overflow-y-auto p-4">
			<div className="text-[13px] font-semibold text-[var(--shell-ink)]">{t.templatePreview}</div>
			<div className="w-[228px] shrink-0 rounded-[34px] border-[10px] border-[var(--shell-ink)] bg-[var(--shell-ink)] shadow-[0_16px_32px_rgba(14,24,55,.22)]">
				<div className="relative overflow-hidden rounded-[24px]" style={chatWallpaperStyle}>
					<div className="absolute start-1/2 top-1.5 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--shell-ink)_72%,transparent)]" />
					<div className="flex min-h-[292px] max-h-[340px] flex-col justify-end px-2 pb-3 pt-8">
						<div className="ms-auto w-full max-w-[176px] overflow-hidden rounded-[14px] text-[12px] font-medium shadow-[0_1px_0_rgba(0,0,0,0.08)]" style={{ background: WA.bubbleOut, color: WA.text }}>
							{createForm.headerFormat === 'IMAGE' && headerSamplePreview ? (
								<img src={headerSamplePreview} alt="" className="max-h-24 w-full object-cover" />
							) : null}
							{createForm.headerFormat === 'IMAGE' && !headerSamplePreview ? (
								<div className="grid h-20 place-items-center bg-[var(--color-primary-soft)]">
									<ImageIcon className="h-6 w-6 text-[var(--shell-muted)]" />
								</div>
							) : null}
							{createForm.headerFormat === 'VIDEO' ? (
								<div className="grid h-20 place-items-center bg-[var(--color-primary-soft)]">
									<Video className="h-6 w-6 text-[var(--shell-muted)]" />
								</div>
							) : null}
							{createForm.headerFormat === 'DOCUMENT' ? (
								<div className="flex items-center gap-1.5 px-2.5 pt-2">
									<FileText className="h-4 w-4 text-[var(--shell-muted)]" />
									<span className="truncate text-[10px] text-[var(--shell-muted)]">{headerSampleFile?.name || 'document.pdf'}</span>
								</div>
							) : null}
							<div className="px-2.5 py-2">
								{createForm.headerFormat === 'TEXT' && createForm.headerText.trim() ? (
									<div className="mb-1 text-[11px] font-bold">{createForm.headerText}</div>
								) : null}
								<div className="whitespace-pre-wrap break-words text-[12px] leading-4">
									{createForm.bodyText.trim() || '…'}
								</div>
								{createForm.footerText.trim() ? (
									<div className="mt-1 text-[10px] text-[var(--shell-muted)]">{createForm.footerText}</div>
								) : null}
							</div>
							{buttons.length ? (
								<div className="border-t border-[color-mix(in_srgb,var(--shell-ink)_8%,transparent)]">
									{buttons.map((btn, i) => (
										<div
											key={btn.id || i}
											className="flex items-center justify-center gap-1 border-t border-[color-mix(in_srgb,var(--shell-ink)_6%,transparent)] px-2 py-1.5 text-[11px] font-semibold text-[var(--shell-blue)]"
										>
											{btn.type === 'URL' ? <Link2 className="h-3 w-3" /> : null}
											{btn.type === 'PHONE_NUMBER' ? <PubIcon src={PUB.phone} className="h-3 w-3 object-contain" /> : null}
											{btn.text}
										</div>
									))}
								</div>
							) : null}
						</div>
					</div>
				</div>
				<div className="mx-auto my-1.5 h-1 w-10 rounded-full bg-white/35" />
			</div>
			<p className="max-w-[220px] text-center text-[11px] leading-4 text-[var(--shell-muted)]">
				{createForm.name || '—'} · {createForm.language} · {createForm.category} · PENDING
			</p>
		</div>
	);
}

function Avatar({ name, size = 48 }) {
	return (
		<div
			className="grid shrink-0 place-items-center rounded-full font-bold text-white"
			style={{
				width: size,
				height: size,
				background: 'linear-gradient(145deg, var(--shell-muted), var(--shell-muted))',
				fontSize: size > 40 ? 16 : 13,
			}}
		>
			{initials(name)}
		</div>
	);
}

function parseFlashMessage(message) {
	const text = String(message || '').trim();
	if (!text) return null;
	const sep = text.includes(' — ') ? ' — ' : text.includes(' - ') ? ' - ' : text.includes(': ') ? ': ' : null;
	if (sep) {
		const idx = text.indexOf(sep);
		const title = text.slice(0, idx).trim();
		const detail = text.slice(idx + sep.length).trim();
		if (title && detail) return { title, detail, full: text };
	}
	return { title: text, detail: '', full: text };
}

function AlertBanner({ message, tone = 'error', onClose, hint, t, floating = false }) {
	const parsed = parseFlashMessage(message);
	if (!parsed) return null;
	const isError = tone === 'error';
	const showHint =
		hint ||
		(isError &&
		/invalid parameter/i.test(parsed.full) &&
		!/button input|library buttons|hsm_id requires name/i.test(parsed.full)
			? t?.metaInvalidParamHint
			: null) ||
		(isError && /131058|hello world templates can only be sent/i.test(parsed.full)
			? t?.helloWorldTestOnlyHint
			: null);

	return (
		<div
			className={`inline-flex max-w-[min(92vw,26rem)] items-start gap-2.5 rounded-2xl px-3.5 py-2.5 text-[13px] backdrop-blur-md transition-all duration-300 ${
				floating
					? 'animate-in fade-in slide-in-from-top-2 zoom-in-95 shadow-[0_12px_40px_rgba(11,20,26,0.16)]'
					: 'shadow-[0_1px_0_rgba(0,0,0,0.06)]'
			}`}
			style={{
				width: 'fit-content',
				background: isError
					? 'linear-gradient(180deg, rgba(255,247,247,0.97) 0%, rgba(254,226,226,0.95) 100%)'
					: 'linear-gradient(180deg, rgba(240,253,244,0.97) 0%, rgba(220,252,231,0.95) 100%)',
				color: isError ? 'var(--color-negative)' : 'var(--color-positive)',
				border: `1px solid ${isError ? 'rgba(244,63,94,0.22)' : 'rgba(34,197,94,0.28)'}`,
				boxShadow: floating
					? isError
						? '0 10px 30px rgba(225,29,72,0.12), 0 2px 8px rgba(11,20,26,0.08)'
						: '0 10px 30px rgba(34,197,94,0.12), 0 2px 8px rgba(11,20,26,0.08)'
					: undefined,
			}}
			role="alert"
		>
			<div
				className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full"
				style={{
					background: isError
						? 'linear-gradient(145deg, var(--color-negative), var(--color-negative))'
						: 'linear-gradient(145deg, var(--color-positive), var(--color-positive))',
					boxShadow: isError
						? '0 4px 10px rgba(225,29,72,0.28)'
						: '0 4px 10px rgba(22,163,74,0.28)',
				}}
			>
				{isError ? (
					<span className="text-[13px] font-black leading-none text-white">!</span>
				) : (
					<Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
				)}
			</div>
			<div className="min-w-0 pe-1">
				<div className="font-semibold leading-snug tracking-tight">
					{isError && /invalid parameter/i.test(parsed.title)
						? `${t?.metaErrorTitle || 'Meta API error'}: ${parsed.title}`
						: parsed.title}
				</div>
				{parsed.detail ? (
					<p className="mt-1 max-w-[22rem] whitespace-pre-wrap break-words text-[12px] leading-relaxed opacity-90">
						{parsed.detail}
					</p>
				) : null}
				{showHint ? (
					<p className="mt-1.5 max-w-[22rem] whitespace-pre-wrap break-words text-[11px] leading-relaxed opacity-75">
						{showHint}
					</p>
				) : null}
			</div>
			{onClose ? (
				<button
					type="button"
					onClick={onClose}
					title={t?.errorDismiss || 'Dismiss'}
					className="shrink-0 rounded-full p-1.5 opacity-60 transition hover:bg-[var(--color-surface-soft)] hover:opacity-100"
					style={{ color: 'inherit' }}
				>
					<X className="h-3.5 w-3.5" />
				</button>
			) : null}
		</div>
	);
}

function isSuccessFlash(flash, t) {
	return (
		flash === t.saveOk ||
		flash === t.validateOk ||
		flash === t.templateCreateOk ||
		flash === t.templateEditOk ||
		flash === t.verifySendOk ||
		flash === t.libraryAdded ||
		flash === t.templateDeleted ||
		flash === t.templateCopied ||
		flash === t.favoriteUpdated ||
		flash === t.fastReplySaved ||
		flash === t.fastReplyDeleted ||
		(typeof flash === 'string' && flash.startsWith(t.seedSubmitted))
	);
}

/** WhatsApp-style bubble preview for Meta library / verification templates */
function LibraryWaBubble({ item }) {
	const buttons = Array.isArray(item?.buttons)
		? item.buttons
		: Array.isArray(item?.raw?.buttons)
			? item.raw.buttons
			: [];
	const header = item?.header || item?.raw?.header || item?.raw?.header_text || '';
	const body = item?.body || item?.note || item?.raw?.body || item?.raw?.body_text || '—';
	const footer = item?.footer || item?.raw?.footer || item?.raw?.footer_text || '';

	return (
		<div className="flex justify-end">
			<div
				className="w-full max-w-[280px] overflow-hidden text-[13px] shadow-[0_1px_0_rgba(0,0,0,0.08)]"
				style={{ background: WA.bubbleOut, color: WA.text, borderRadius: 12 }}
			>
				{header ? (
					<div className="border-b px-3 py-2 text-[12px] font-bold" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
						{header}
					</div>
				) : null}
				<div className="whitespace-pre-wrap break-words px-3 py-2 leading-[1.35]">
					<RichMessageText text={body} />
				</div>
				{footer ? (
					<div className="px-3 pb-2 text-[11px]" style={{ color: WA.muted }}>{footer}</div>
				) : null}
				<div className="flex items-center justify-end gap-1 px-2.5 pb-1.5 text-[10px]" style={{ color: 'rgba(0,0,0,0.45)' }}>
					<span>WA</span>
					<CheckCheck className="h-3.5 w-3.5" style={{ color: 'var(--shell-blue)' }} />
				</div>
				{buttons.length ? (
					<div className="border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
						{buttons.map((btn, i) => {
							const text = typeof btn === 'string' ? btn : btn?.text || btn?.title || 'Button';
							const type = String(btn?.type || '').toUpperCase();
							return (
								<div
									key={`${text}-${i}`}
									className="flex items-center justify-center gap-1.5 border-t px-3 py-2 text-[13px] font-semibold"
									style={{
										borderColor: i === 0 ? 'transparent' : 'rgba(0,0,0,0.06)',
										color: 'var(--shell-blue)',
									}}
								>
									{type === 'URL' ? <Link2 className="h-3.5 w-3.5" /> : null}
									{type === 'PHONE_NUMBER' ? <PubIcon src={PUB.phone} className="h-3.5 w-3.5 object-contain" /> : null}
									{text}
								</div>
							);
						})}
					</div>
				) : null}
			</div>
		</div>
	);
}

function ChatFilterBar({ items, value, onChange, isAr }) {
	const scrollerRef = useRef(null);
	const [canStart, setCanStart] = useState(false);
	const [canEnd, setCanEnd] = useState(false);

	const syncScroll = useCallback(() => {
		const el = scrollerRef.current;
		if (!el) return;
		const max = el.scrollWidth - el.clientWidth;
		if (max <= 8) {
			setCanStart(false);
			setCanEnd(false);
			return;
		}
		const sl = el.scrollLeft;
		if (sl < 0) {
			setCanStart(sl < -8);
			setCanEnd(sl > -max + 8);
			return;
		}
		setCanStart(sl > 8);
		setCanEnd(sl < max - 8);
	}, []);

	useEffect(() => {
		const el = scrollerRef.current;
		if (!el) return;
		syncScroll();
		el.addEventListener('scroll', syncScroll, { passive: true });
		const ro = new ResizeObserver(syncScroll);
		ro.observe(el);
		return () => {
			el.removeEventListener('scroll', syncScroll);
			ro.disconnect();
		};
	}, [syncScroll, items]);

	useEffect(() => {
		const el = scrollerRef.current;
		if (!el) return;
		const active = el.querySelector('[data-filter-active="true"]');
		active?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
	}, [value]);

	function nudge(dir) {
		const el = scrollerRef.current;
		if (!el) return;
		const sign = isAr ? -1 : 1;
		el.scrollBy({ left: sign * dir * 140, behavior: 'smooth' });
	}

	return (
		<div className="flex items-center gap-1 rounded-2xl border border-[var(--shell-line)] bg-[color-mix(in_srgb,var(--color-surface-soft)_80%,var(--color-surface-elevated))] p-1">
			{canStart ? (
				<button
					type="button"
					aria-label={isAr ? 'الفلاتر السابقة' : 'Previous filters'}
					onClick={() => nudge(-1)}
					className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[var(--shell-blue)] transition hover:bg-[var(--color-primary-soft)]"
				>
					<ChevronLeft className={`h-4 w-4 ${isAr ? 'rotate-180' : ''}`} strokeWidth={2.4} />
				</button>
			) : null}
			<div className="relative min-h-8 min-w-0 flex-1 overflow-hidden">
				{canStart ? (
					<span className="pointer-events-none absolute inset-y-0 start-0 z-10 w-5 bg-gradient-to-r from-[var(--color-surface-elevated)] to-transparent rtl:from-transparent rtl:to-[var(--color-surface-elevated)]" />
				) : null}
				{canEnd ? (
					<span className="pointer-events-none absolute inset-y-0 end-0 z-10 w-5 bg-gradient-to-l from-[var(--color-surface-elevated)] to-transparent rtl:from-transparent rtl:to-[var(--color-surface-elevated)]" />
				) : null}
				<nav
					ref={scrollerRef}
					aria-label="Conversation filters"
					className="flex h-8 items-center gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
					style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
				>
					{items.map(item => {
						const active = value === item.id;
						const count = typeof item.count === 'number' ? (item.count > 999 ? '999+' : item.count) : 0;
						return (
							<button
								key={item.id}
								type="button"
								data-filter-active={active ? 'true' : 'false'}
								aria-pressed={active}
								title={item.title || item.label}
								onClick={() => onChange(item.id)}
								className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-[12px] transition-all duration-200 ${
									active
										? 'bg-[var(--shell-blue)] font-semibold text-white shadow-[0_4px_10px_color-mix(in_srgb,var(--shell-blue)_28%,transparent)]'
										: 'font-medium text-[var(--shell-muted)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--shell-blue)]'
								}`}
							>
								<span>{item.label}</span>
								<span
									className={`grid min-w-[18px] place-items-center rounded-full px-1.5 text-[10px] font-bold leading-4 ${
										active
											? 'bg-white/20 text-white'
											: 'bg-[var(--color-primary-soft)] text-[var(--shell-blue)]'
									}`}
								>
									{count}
								</span>
							</button>
						);
					})}
				</nav>
			</div>
			{canEnd ? (
				<button
					type="button"
					aria-label={isAr ? 'المزيد من الفلاتر' : 'More filters'}
					onClick={() => nudge(1)}
					className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[var(--shell-blue)] transition hover:bg-[var(--color-primary-soft)]"
				>
					<ChevronRight className={`h-4 w-4 ${isAr ? 'rotate-180' : ''}`} strokeWidth={2.4} />
				</button>
			) : null}
		</div>
	);
}

function ComposeIconBtn({ title, disabled, onClick, children }) {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			title={title}
			className="grid h-9 w-9 place-items-center rounded-full text-[var(--shell-muted)] transition-all duration-200 hover:scale-110 hover:bg-[var(--color-primary-soft)] hover:text-[var(--shell-blue)] active:scale-95 disabled:pointer-events-none disabled:opacity-40"
		>
			{children}
		</button>
	);
}

function RailBtn({ active, onClick, title, children, badge }) {
	const showCount = typeof badge === 'number' && badge > 0;
	const showDot = badge === true;
	return (
		<button
			type="button"
			onClick={onClick}
			title={title}
			className={`group relative flex h-[124px] w-full flex-col items-center justify-center gap-1.5 rounded-[18px] text-[12px] font-semibold transition-[background-color,color,box-shadow,transform] duration-200 ease-out ${
				active
					? 'bg-[var(--color-primary-soft)] text-[var(--shell-blue)] shadow-[0_6px_14px_color-mix(in_srgb,var(--shell-blue)_10%,transparent)]'
					: 'bg-transparent text-[var(--shell-muted)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--shell-blue)] hover:shadow-[0_8px_18px_color-mix(in_srgb,var(--shell-blue)_14%,transparent)]'
			} hover:-translate-y-0.5`}
		>
			<span className="grid h-[72px] w-[72px] place-items-center transition-transform duration-200 ease-out group-hover:scale-110">
				{children}
			</span>
			<span className="max-w-full truncate px-0.5 leading-tight">{title}</span>
			{showCount ? (
				<span className="absolute end-1 top-1 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--shell-blue)] px-1.5 text-[11px] font-bold text-white">
					{badge}
				</span>
			) : null}
			{showDot ? (
				<span className="absolute end-2 top-2 h-2 w-2 rounded-full bg-[var(--color-warning)]" />
			) : null}
		</button>
	);
}

function StatusTicks({ status }) {
	if (status === 'read') return <CheckCheck className="h-3.5 w-3.5" style={{ color: WA.tick }} />;
	if (status === 'delivered') return <CheckCheck className="h-3.5 w-3.5 text-[var(--shell-muted)]" />;
	if (status === 'sent' || status === 'queued' || status === 'pending') {
		return <Check className="h-3.5 w-3.5 text-[var(--shell-muted)]" />;
	}
	if (status === 'failed') return <span className="text-[10px] text-[var(--color-negative)]">!</span>;
	return null;
}

function FieldActions({ value, t, onGenerate }) {
	const [copied, setCopied] = useState(false);
	async function copy() {
		if (!value) return;
		try {
			await navigator.clipboard.writeText(String(value));
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			/* ignore */
		}
	}
	return (
		<div className="flex items-center gap-1">
			{onGenerate && (
				<Button type="button" variant="ghost" size="sm" onClick={onGenerate}>
					{t.generateToken}
				</Button>
			)}
			<Button type="button" variant="ghost" size="sm" onClick={() => void copy()} disabled={!value}>
				{copied ? <Check className="h-4 w-4 text-[var(--color-positive)]" /> : <Copy className="h-4 w-4" />}
				{copied ? t.copied : t.copy}
			</Button>
		</div>
	);
}

function ConfigField({
	label,
	value,
	onChange,
	t,
	type = 'text',
	placeholder,
	readOnly = false,
	mono = false,
	onGenerate,
	generateInside = false,
	hint,
	required = false,
	saved = false,
}) {
	return (
		<label className="block space-y-1.5">
			<div className="flex items-center justify-between gap-2">
				<span className="text-[11px] font-bold text-[var(--shell-muted)]">
					{label}
					{required ? <span className="ms-1 text-[var(--color-positive)]">*</span> : null}
					{saved && !value ? (
						<span className="ms-2 rounded bg-[var(--color-positive-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-positive)]">
							{t.savedSecret.split('—')[0].trim()}
						</span>
					) : null}
				</span>
				<FieldActions value={value} t={t} onGenerate={generateInside ? undefined : onGenerate} />
			</div>
			<div className="relative">
				<Input
					type={type}
					value={value ?? ''}
					onChange={e => onChange?.(e.target.value)}
					readOnly={readOnly}
					placeholder={placeholder}
					className={`w-full ${mono ? 'font-mono' : ''} ${generateInside && onGenerate ? 'pe-24' : ''}`}
				/>
				{generateInside && onGenerate ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="absolute end-1.5 top-1/2 -translate-y-1/2 text-[var(--color-positive)]"
						onClick={onGenerate}
					>
						{t.generateToken}
					</Button>
				) : null}
			</div>
			{hint ? <p className="text-[9.5px] leading-relaxed text-[var(--shell-muted)]">{hint}</p> : null}
		</label>
	);
}

function isMediaPlaceholderBody(body) {
	return /^\[(image|video|audio|voice|sticker|document|unsupported)\]$/i.test(
		String(body || '').trim(),
	);
}

function messageCaption(message) {
	const body = String(message?.body || '').trim();
	if (!body || isMediaPlaceholderBody(body)) return '';
	return body;
}

function getMessageTranslateText(message, templates = []) {
	if (!message) return '';
	const type = String(message.messageType || '').toLowerCase();
	if (type === 'template') {
		return String(renderTemplateMessageDisplay(message, templates) || '').trim();
	}
	if (type === 'button' || type === 'interactive') {
		return String(messageCaption(message) || message.body || '')
			.replace(/^\[button\]\s*/i, '')
			.trim();
	}
	const caption = messageCaption(message);
	if (caption) return caption;
	if (type === 'text' && message.body && !isMediaPlaceholderBody(message.body)) {
		return String(message.body).trim();
	}
	return '';
}

function detectTranslateTarget(text) {
	return /[\u0600-\u06FF]/.test(String(text || '')) ? 'en' : 'ar';
}

function buildChatRows(messages = []) {
	const rows = [];
	let i = 0;
	while (i < messages.length) {
		const m = messages[i];
		if (m?.messageType === 'image' && m.hasMedia) {
			const group = [m];
			let j = i + 1;
			while (j < messages.length) {
				const n = messages[j];
				if (n?.messageType === 'image' && n.hasMedia && n.direction === m.direction) {
					group.push(n);
					j += 1;
				} else break;
			}
			if (group.length >= 2) {
				rows.push({
					kind: 'image_grid',
					key: `grid_${group.map(x => x.id).join('_')}`,
					messages: group,
					direction: m.direction,
				});
				i = j;
				continue;
			}
		}
		rows.push({ kind: 'single', key: m.id, message: m });
		i += 1;
	}
	return rows;
}

function formatAudioClock(sec) {
	if (!Number.isFinite(sec) || sec < 0) return '0:00';
	const s = Math.floor(sec);
	const m = Math.floor(s / 60);
	const r = s % 60;
	return `${m}:${String(r).padStart(2, '0')}`;
}

function VoiceNotePlayer({ src, mine }) {
	const audioRef = useRef(null);
	const [playing, setPlaying] = useState(false);
	const [progress, setProgress] = useState(0);
	const [duration, setDuration] = useState(0);

	useEffect(() => {
		const el = audioRef.current;
		if (!el) return undefined;
		const onTime = () => setProgress(el.currentTime || 0);
		const onMeta = () => setDuration(el.duration || 0);
		const onEnded = () => {
			setPlaying(false);
			setProgress(0);
		};
		el.addEventListener('timeupdate', onTime);
		el.addEventListener('loadedmetadata', onMeta);
		el.addEventListener('ended', onEnded);
		return () => {
			el.removeEventListener('timeupdate', onTime);
			el.removeEventListener('loadedmetadata', onMeta);
			el.removeEventListener('ended', onEnded);
		};
	}, [src]);

	async function toggle() {
		const el = audioRef.current;
		if (!el) return;
		if (playing) {
			el.pause();
			setPlaying(false);
			return;
		}
		try {
			await el.play();
			setPlaying(true);
		} catch {
			setPlaying(false);
		}
	}

	const pct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;
	const bars = [4, 10, 6, 14, 8, 12, 5, 16, 9, 11, 7, 13, 6, 15, 8, 10, 5, 12, 7, 14];

	return (
		<div className="flex min-w-[220px] max-w-[280px] items-center gap-2.5 py-0.5">
			<audio ref={audioRef} src={src} preload="metadata" className="hidden" />
			<button
				type="button"
				onClick={() => void toggle()}
				className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white shadow-sm"
				style={{ background: mine ? 'var(--color-positive)' : 'var(--color-positive)' }}
			>
				{playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ms-0.5 h-4 w-4 fill-current" />}
			</button>
			<div className="min-w-0 flex-1">
				<button
					type="button"
					className="flex w-full items-end gap-[2px]"
					onClick={e => {
						const el = audioRef.current;
						const rect = e.currentTarget.getBoundingClientRect();
						const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
						if (el && duration) {
							el.currentTime = ratio * duration;
							setProgress(el.currentTime);
						}
					}}
				>
					{bars.map((h, idx) => (
						<span
							key={idx}
							className="w-[3px] rounded-full"
							style={{
								height: h,
								background:
									(idx / bars.length) * 100 <= pct
										? mine
											? 'var(--color-positive)'
											: 'var(--color-positive)'
										: 'rgba(0,0,0,0.22)',
							}}
						/>
					))}
				</button>
				<div className="mt-1 flex items-center justify-between text-[11px]" style={{ color: 'rgba(0,0,0,0.45)' }}>
					<span>{formatAudioClock(playing || progress ? progress : duration)}</span>
					<Mic className="h-3 w-3 opacity-50" />
				</div>
			</div>
		</div>
	);
}

function MediaBubble({ message, mine, onOpenMedia, labels }) {
	const [url, setUrl] = useState(null);
	const [failed, setFailed] = useState(false);
	const type = String(message.messageType || '').toLowerCase();

	useEffect(() => {
		let revoked = false;
		let objectUrl = null;
		if (!message.hasMedia || !message.mediaUrl) return undefined;
		metaWhatsAppApi
			.mediaBlobUrl(message.mediaUrl)
			.then(u => {
				if (revoked) {
					URL.revokeObjectURL(u);
					return;
				}
				objectUrl = u;
				setUrl(u);
			})
			.catch(() => setFailed(true));
		return () => {
			revoked = true;
			if (objectUrl) URL.revokeObjectURL(objectUrl);
		};
	}, [message.id, message.mediaUrl, message.hasMedia]);

	if (failed) {
		return (
			<div className="text-[12px] opacity-70">
				{labels?.mediaUnavailable || 'Media unavailable'}
			</div>
		);
	}
	if (!url) {
		return (
			<div className="flex h-24 w-40 items-center justify-center rounded-lg bg-black/5">
				<LoaderCircle className="h-5 w-5 animate-spin opacity-60" />
			</div>
		);
	}

	if (type === 'sticker') {
		return (
			<button type="button" onClick={() => onOpenMedia?.(url, 'sticker')} className="block">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={url} alt="sticker" className="h-36 w-36 object-contain drop-shadow-sm" />
			</button>
		);
	}

	if (type === 'image') {
		return (
			<button
				type="button"
				onClick={() => onOpenMedia?.(url, 'image')}
				className="block overflow-hidden rounded-lg"
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={url}
					alt={messageCaption(message) || 'image'}
					className="max-h-72 max-w-full object-cover transition hover:brightness-95"
				/>
			</button>
		);
	}

	if (type === 'audio' || type === 'voice') {
		return <VoiceNotePlayer src={url} mine={mine} />;
	}

	if (type === 'video') {
		return (
			<video
				controls
				playsInline
				preload="metadata"
				src={url}
				className="max-h-72 w-full max-w-[300px] rounded-lg bg-black"
			/>
		);
	}

	return (
		<a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 underline">
			<FileText className="h-4 w-4" />
			{message.mediaFileName || 'Document'}
		</a>
	);
}

function ImageGridBubble({ messages, mine, onOpenMedia, locale }) {
	const [urls, setUrls] = useState({});
	const count = messages.length;
	const show = messages.slice(0, 4);
	const extra = Math.max(0, count - 4);

	useEffect(() => {
		let cancelled = false;
		const created = [];
		Promise.all(
			show.map(async m => {
				if (!m.mediaUrl) return [m.id, null];
				try {
					const u = await metaWhatsAppApi.mediaBlobUrl(m.mediaUrl);
					created.push(u);
					return [m.id, u];
				} catch {
					return [m.id, null];
				}
			}),
		).then(entries => {
			if (cancelled) {
				created.forEach(u => URL.revokeObjectURL(u));
				return;
			}
			setUrls(Object.fromEntries(entries));
		});
		return () => {
			cancelled = true;
			created.forEach(u => URL.revokeObjectURL(u));
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [messages.map(m => m.id).join('|')]);

	const last = messages[messages.length - 1];
	const gridClass =
		count === 2
			? 'grid-cols-2'
			: count === 3
				? 'grid-cols-2'
				: 'grid-cols-2';

	return (
		<div
			className={`relative max-w-[300px] overflow-hidden rounded-xl p-0.5 shadow-[0_1px_0_rgba(0,0,0,0.08)] ${mine ? '' : ''}`}
			style={{ background: mine ? WA.bubbleOut : WA.bubbleIn }}
		>
			<div className={`grid gap-0.5 ${gridClass}`}>
				{show.map((m, idx) => {
					const url = urls[m.id];
					const tall =
						count === 3 && idx === 0 ? 'row-span-2 min-h-[200px]' : 'min-h-[110px]';
					const isLast = idx === show.length - 1 && extra > 0;
					return (
						<button
							key={m.id}
							type="button"
							onClick={() => url && onOpenMedia?.(url, 'image')}
							className={`relative overflow-hidden bg-black/10 ${tall} ${
								count === 3 && idx === 0 ? 'col-span-1' : ''
							}`}
						>
							{url ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img src={url} alt="" className="h-full w-full object-cover" />
							) : (
								<div className="grid h-full place-items-center">
									<LoaderCircle className="h-5 w-5 animate-spin opacity-50" />
								</div>
							)}
							{isLast ? (
								<div className="absolute inset-0 grid place-items-center bg-black/45 text-2xl font-semibold text-white">
									+{extra}
								</div>
							) : null}
						</button>
					);
				})}
			</div>
			<div className="flex items-center justify-end gap-1 px-2 py-1 text-[11px] font-medium" style={{ color: 'rgba(0,0,0,0.50)' }}>
				<span>{formatTime(last?.createdAt || last?.providerTimestamp, locale)}</span>
				{mine ? <StatusTicks status={last?.status} /> : null}
			</div>
		</div>
	);
}

function MediaLightbox({ url, kind, onClose }) {
	useEffect(() => {
		if (!url) return undefined;
		const onKey = e => {
			if (e.key === 'Escape') onClose?.();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [url, onClose]);

	if (!url) return null;
	return (
		<div
			className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4"
			onClick={onClose}
		>
			<button
				type="button"
				onClick={onClose}
				className="absolute end-4 top-4 rounded-full bg-[color-mix(in_srgb,var(--color-surface-elevated)_10%,transparent)] p-2 text-white hover:bg-[color-mix(in_srgb,var(--color-surface-elevated)_20%,transparent)]"
			>
				<X className="h-6 w-6" />
			</button>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={url}
				alt=""
				className={`max-h-[92vh] max-w-[96vw] object-contain ${kind === 'sticker' ? 'drop-shadow-2xl' : ''}`}
				onClick={e => e.stopPropagation()}
			/>
		</div>
	);
}

function formatMoneyUsd(value) {
	const n = Number(value || 0);
	return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatMoneyEgp(value) {
	const n = Number(value || 0);
	return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} QAR`;
}

/** Per-message rate card amounts (need more precision than invoice totals). */
function formatRateUsd(value) {
	const n = Number(value || 0);
	return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

function formatRateEgp(value) {
	const n = Number(value || 0);
	return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} QAR`;
}

function MoneyDuo({ usd, egp, size = 'md', align = 'end' }) {
	const usdText = formatMoneyUsd(usd);
	const egpText = formatMoneyEgp(egp);
	const alignCls = align === 'start' ? 'items-start text-start' : align === 'center' ? 'items-center text-center' : 'items-end text-end';
	if (size === 'xl') {
		return (
			<div className={`flex flex-col ${alignCls}`}>
				<span className="text-[22px] font-bold tabular-nums tracking-tight text-white">{usdText}</span>
				<span className="text-[12px] font-semibold tabular-nums text-white/85">{egpText}</span>
			</div>
		);
	}
	if (size === 'lg') {
		return (
			<div className={`flex flex-col ${alignCls}`}>
				<span className="text-[16px] font-bold tabular-nums" style={{ color: WA.text }}>{usdText}</span>
				<span className="text-[11px] font-medium tabular-nums" style={{ color: WA.muted }}>{egpText}</span>
			</div>
		);
	}
	if (size === 'inline') {
		return (
			<span className="inline-flex items-baseline gap-1.5 tabular-nums whitespace-nowrap">
				<span className="text-[11px] font-bold" style={{ color: WA.text }}>{usdText}</span>
				<span className="text-[10px]" style={{ color: WA.muted }}>{egpText}</span>
			</span>
		);
	}
	return (
		<span className="inline-flex flex-col leading-tight tabular-nums" style={{ textAlign: align === 'start' ? 'start' : 'end' }}>
			<span className="text-[12px] font-bold" style={{ color: WA.text }}>{usdText}</span>
			<span className="text-[10px]" style={{ color: WA.muted }}>{egpText}</span>
		</span>
	);
}

const USAGE_CAT_STYLE = {
	MARKETING: { bg: 'var(--color-negative-soft)', bar: 'var(--color-warning)', text: 'var(--color-warning)' },
	UTILITY: { bg: 'var(--color-positive-soft)', bar: 'var(--color-positive)', text: 'var(--color-positive)' },
	AUTHENTICATION: { bg: 'var(--color-primary-soft)', bar: 'var(--shell-blue)', text: 'var(--shell-blue)' },
	SERVICE: { bg: 'var(--color-positive-soft)', bar: 'var(--color-positive)', text: 'var(--color-positive)' },
	UNKNOWN: { bg: 'var(--color-surface-elevated)', bar: 'var(--shell-muted)', text: 'var(--shell-muted)' },
};

export default function MetaWhatsAppWorkspace() {
	const { i18n } = useTranslation();
	const locale = i18n.language?.startsWith('ar') ? 'ar' : 'en';
	const isAr = locale === 'ar';
	const t = COPY[isAr ? 'ar' : 'en'];

	const [status, setStatus] = useState(null);
	const [loading, setLoading] = useState(true);
	const [demoMode, setDemoMode] = useState(() => getWhatsAppDemoMode());
	const [flash, setFlash] = useState(null);
	const [error, setError] = useState(null);
	const [usageData, setUsageData] = useState(null);
	const [usageLoading, setUsageLoading] = useState(false);
	const [usageError, setUsageError] = useState(null);
	const [usageMarket, setUsageMarket] = useState('QATAR');
	const [phoneMenuOpen, setPhoneMenuOpen] = useState(false);
	const [openingPhone, setOpeningPhone] = useState(false);
	const [importRows, setImportRows] = useState([]);
	const [importOpen, setImportOpen] = useState(false);
	const [importBusy, setImportBusy] = useState(false);
	const [saving, setSaving] = useState(false);
	const [validating, setValidating] = useState(false);

	const [form, setForm] = useState(emptyConfigForm);
	const [configHelpOpen, setConfigHelpOpen] = useState(true);

	const [q, setQ] = useState('');
	const [filter, setFilter] = useState('all');
	const [filterCounts, setFilterCounts] = useState({
		all: 0,
		unread: 0,
		leads: 0,
		fav: 0,
		replied: 0,
		unreplied: 0,
		window24h: 0,
	});
	const [listLoading, setListLoading] = useState(false);
	const [conversations, setConversations] = useState([]);
	const [activeId, setActiveId] = useState(null);
	const [active, setActive] = useState(null);
	const [messages, setMessages] = useState([]);
	const [draft, setDraft] = useState('');
	const [quickRepliesOpen, setQuickRepliesOpen] = useState(false);
	const [quickReplies, setQuickReplies] = useState([]);
	const [quickRepliesLoading, setQuickRepliesLoading] = useState(false);
	const [quickReplySaving, setQuickReplySaving] = useState(false);
	const [quickReplyFormOpen, setQuickReplyFormOpen] = useState(false);
	const [quickReplyTitle, setQuickReplyTitle] = useState('');
	const [quickReplyBody, setQuickReplyBody] = useState('');
	const [openingChatPhone, setOpeningChatPhone] = useState(false);
	/** messageId -> { open, loading, text, sourceLang, targetLang, error } */
	const [messageTranslations, setMessageTranslations] = useState({});
	const [templateName, setTemplateName] = useState('');
	const [templateLang, setTemplateLang] = useState(isAr ? 'ar' : 'en');
	const [templates, setTemplates] = useState([]);
	const [templatesLoading, setTemplatesLoading] = useState(false);
	const [templatesError, setTemplatesError] = useState(null);
	const [sidebarView, setSidebarView] = useState('chats'); // chats | templates | phones | usage
	const [phonesPanel, setPhonesPanel] = useState('config'); // config | webhooks | activity
	const [syncReport, setSyncReport] = useState(null);
	const [syncingMeta, setSyncingMeta] = useState(false);
	const [webhookImportResult, setWebhookImportResult] = useState(null);
	const [importingWebhooks, setImportingWebhooks] = useState(false);
	const [accounts, setAccounts] = useState([]);
	const [templatesMode, setTemplatesMode] = useState('list'); // list | create | seed | library
	const [seedTemplates, setSeedTemplates] = useState([]);
	const [seedNote, setSeedNote] = useState('');
	const [seedSelected, setSeedSelected] = useState({});
	const [seedLoading, setSeedLoading] = useState(false);
	const [seedSubmitting, setSeedSubmitting] = useState(false);
	const [libraryItems, setLibraryItems] = useState([]);
	const [libraryVerification, setLibraryVerification] = useState([]);
	const [libraryLoading, setLibraryLoading] = useState(false);
	const [librarySearch, setLibrarySearch] = useState('');
	const [libraryCreatingKey, setLibraryCreatingKey] = useState('');
	const [libraryOpen, setLibraryOpen] = useState(false);
	const [verifyOpen, setVerifyOpen] = useState(false);
	const [verifyPhone, setVerifyPhone] = useState('');
	const [verifyTemplate, setVerifyTemplate] = useState(null); // { name, language, components?, body? }
	const [previewTemplate, setPreviewTemplate] = useState(null);
	const [deletingTemplateKey, setDeletingTemplateKey] = useState('');
	const [createFormErrors, setCreateFormErrors] = useState({});
	const [sendTemplateOpen, setSendTemplateOpen] = useState(false);
	const [selectedTemplateKey, setSelectedTemplateKey] = useState('');
	const [templateVarValues, setTemplateVarValues] = useState({});
	const [templateVarErrors, setTemplateVarErrors] = useState({});
	const [creatingTemplate, setCreatingTemplate] = useState(false);
	const [createForm, setCreateForm] = useState(() => emptyCreateTemplateForm(isAr));
	const [editingTemplateId, setEditingTemplateId] = useState('');
	const [existingHeaderComponent, setExistingHeaderComponent] = useState(null);
	const [headerSampleFile, setHeaderSampleFile] = useState(null);
	const [headerSamplePreview, setHeaderSamplePreview] = useState('');
	const headerSampleRef = useRef(null);
	const [activity, setActivity] = useState([]);
	const [sending, setSending] = useState(false);
	const [recording, setRecording] = useState(false);
	const [recordingPaused, setRecordingPaused] = useState(false);
	const [recordingReady, setRecordingReady] = useState(false);
	const [recordingSeconds, setRecordingSeconds] = useState(0);
	const [recordingLevel, setRecordingLevel] = useState(0.2);
	const [mediaLightbox, setMediaLightbox] = useState(null); // { url, kind }
	const [initialConversation, setInitialConversation] = useState(null);
	const bottomRef = useRef(null);
	const messagesScrollRef = useRef(null);
	const fileRef = useRef(null);
	const imageRef = useRef(null);
	const mediaRecorderRef = useRef(null);
	const chunksRef = useRef([]);
	const recordingIntentRef = useRef('discard');
	const heldVoiceRef = useRef(null);
	const recordingElapsedMsRef = useRef(0);
	const recordingStartedAtRef = useRef(0);
	const recordingAnalyserRef = useRef(null);
	const recordingRafRef = useRef(0);
	const recordingAudioCtxRef = useRef(null);
	const searchTimer = useRef(null);
	const searchInputRef = useRef(null);
	const qRef = useRef(q);
	const filterRef = useRef(filter);
	const dataEpochRef = useRef(0);
	qRef.current = q;
	filterRef.current = filter;

	const webhookUrl = useMemo(() => resolveWebhookUrl(status), [status]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const params = new URLSearchParams(window.location.search);
		const conv = params.get('conversation');
		if (conv) setInitialConversation(conv);
		if (params.get('tab') === 'settings') setSidebarView('phones');
	}, []);

	const loadStatus = useCallback(async (opts = {}) => {
		const epoch = dataEpochRef.current;
		const data = await metaWhatsAppApi.status();
		if (epoch !== dataEpochRef.current) return null;
		setStatus(data);
		setForm(prev => {
			const next = formFromServerStatus(data);
			if (!next.verifyToken && !data?.hasVerifyToken) {
				next.verifyToken = prev.verifyToken || randomVerifyToken();
			}
			return next;
		});
		if (typeof window !== 'undefined') {
			try {
				window.localStorage.removeItem('so7ba.meta-whatsapp.config.draft');
			} catch {
				/* ignore */
			}
		}
		if (opts.redirectIfUnconfigured && (!data.hasAccessToken || !data.enabled)) {
			setSidebarView('phones');
		}
		return data;
	}, []);

	const loadAccounts = useCallback(async () => {
		const epoch = dataEpochRef.current;
		try {
			const data = await metaWhatsAppApi.listAccounts();
			if (epoch !== dataEpochRef.current) return;
			setAccounts(Array.isArray(data?.accounts) ? data.accounts : []);
		} catch {
			if (epoch !== dataEpochRef.current) return;
			setAccounts([]);
		}
	}, []);

	const loadConversations = useCallback(async (query, nextFilter, { silent = true } = {}) => {
		const epoch = dataEpochRef.current;
		const qValue = query !== undefined ? query : qRef.current;
		const filterValue = nextFilter !== undefined ? nextFilter : filterRef.current;
		const serverFilter = ['unread', 'leads', 'fav', 'replied', 'unreplied', 'window24h'].includes(
			filterValue,
		)
			? filterValue
			: undefined;
		if (!silent) setListLoading(true);
		try {
			const [rows, counts] = await Promise.all([
				metaWhatsAppApi.conversations({
					q: qValue || undefined,
					limit:
						filterValue === 'replied' ||
						filterValue === 'window24h' ||
						filterValue === 'unreplied'
							? 5000
							: 500,
					...(serverFilter ? { filter: serverFilter } : {}),
				}),
				metaWhatsAppApi.conversationFilterCounts().catch(() => null),
			]);
			if (epoch !== dataEpochRef.current) return;
			setConversations(Array.isArray(rows) ? rows : []);
			if (counts && typeof counts === 'object') {
				setFilterCounts({
					all: Number(counts.all) || 0,
					unread: Number(counts.unread) || 0,
					leads: Number(counts.leads) || 0,
					fav: Number(counts.fav) || 0,
					replied: Number(counts.replied) || 0,
					unreplied: Number(counts.unreplied) || 0,
					window24h: Number(counts.window24h) || 0,
				});
			}
		} finally {
			if (!silent) setListLoading(false);
		}
	}, []);

	const loadMessages = useCallback(async conversationId => {
		if (!conversationId) return;
		const epoch = dataEpochRef.current;
		const [conv, rawMsgs] = await Promise.all([
			metaWhatsAppApi.conversation(conversationId),
			metaWhatsAppApi.messages(conversationId, { limit: 200 }),
		]);
		if (epoch !== dataEpochRef.current) return;
		const { messages: list, care } = normalizeMessagesPayload(rawMsgs);
		const nextActive = mergeConversationCare(conv, care, list);
		setActive(nextActive);
		setMessages(list);
		void metaWhatsAppApi
			.markRead(conversationId)
			.then(() => {
				notifyMetaWhatsAppUnreadChanged();
				return loadConversations();
			})
			.catch(() => {});
	}, [loadConversations]);

	const resetWorkspaceData = useCallback(() => {
		dataEpochRef.current += 1;
		setConversations([]);
		setActiveId(null);
		setActive(null);
		setMessages([]);
		setTemplates([]);
		setAccounts([]);
		setUsageData(null);
		setActivity([]);
		setQuickReplies([]);
		setLibraryItems([]);
		setFilterCounts({
			all: 0,
			unread: 0,
			leads: 0,
			fav: 0,
			replied: 0,
			unreplied: 0,
			window24h: 0,
		});
		setStatus(null);
		setTemplatesError(null);
		setUsageError(null);
	}, []);

	const bootstrap = useCallback(async () => {
		setDemoMode(getWhatsAppDemoMode());
		resetWorkspaceData();
		setLoading(true);
		setError(null);
		try {
			await loadStatus({ redirectIfUnconfigured: !getWhatsAppDemoMode() });
			await Promise.all([
				loadConversations('', 'all', { silent: true }),
				loadAccounts(),
			]);
		} catch (e) {
			setError(e?.message || t.loadError);
		} finally {
			setLoading(false);
		}
	}, [loadAccounts, loadConversations, loadStatus, resetWorkspaceData, t.loadError]);

	useEffect(() => {
		if (!isWhatsAppDemoToggleVisible()) {
			setWhatsAppDemoMode(false);
			setDemoMode(false);
		}
		void bootstrap();
		// Mount once — switching filters must not remount/hide the workspace.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const syncDemo = () => setDemoMode(getWhatsAppDemoMode());
		window.addEventListener('qsc-whatsapp-demo-changed', syncDemo);
		return () => window.removeEventListener('qsc-whatsapp-demo-changed', syncDemo);
	}, []);

	useEffect(() => {
		if (!flash && !error && !templatesError) return undefined;
		const timer = window.setTimeout(() => {
			setFlash(null);
			setError(null);
			setTemplatesError(null);
		}, 5000);
		return () => window.clearTimeout(timer);
	}, [flash, error, templatesError]);

	useEffect(() => {
		if (!initialConversation) return;
		setActiveId(initialConversation);
		void loadMessages(initialConversation);
	}, [initialConversation, loadMessages]);

	const scrollChatToBottom = useCallback((instant = true) => {
		const el = messagesScrollRef.current;
		const jump = () => {
			if (el) {
				el.scrollTop = el.scrollHeight;
			} else {
				bottomRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'end' });
			}
		};
		// Wait for bubbles to layout before jumping (avoids top→bottom animation)
		requestAnimationFrame(() => {
			jump();
			requestAnimationFrame(jump);
		});
	}, []);

	useEffect(() => {
		if (!activeId) return;
		// Open / update chat: jump to bottom instantly (no top→bottom smooth scroll)
		scrollChatToBottom(true);
	}, [messages, activeId, scrollChatToBottom]);

	// Live poll: always refresh chat list; also pull open-thread messages (webhook inbound)
	useEffect(() => {
		let cancelled = false;
		const tick = async () => {
			const epoch = dataEpochRef.current;
			try {
				await loadConversations();
				if (cancelled || epoch !== dataEpochRef.current || !activeId) return;
				const [conv, rawMsgs] = await Promise.all([
					metaWhatsAppApi.conversation(activeId),
					metaWhatsAppApi.messages(activeId, { limit: 200 }),
				]);
				if (cancelled || epoch !== dataEpochRef.current) return;
				const { messages: list, care } = normalizeMessagesPayload(rawMsgs);
				if (conv || care) {
					setActive(prev => mergeConversationCare(conv || prev, care, list));
				}
				setMessages(prev => {
					const prevKey = prev.map(m => `${m.id}:${m.status}`).join('|');
					const nextKey = list.map(m => `${m.id}:${m.status}`).join('|');
					return prevKey === nextKey ? prev : list;
				});
			} catch {
				/* ignore transient poll errors */
			}
		};
		const timer = setInterval(() => void tick(), 2500);
		const onFocus = () => void tick();
		if (typeof document !== 'undefined') {
			document.addEventListener('visibilitychange', onFocus);
			window.addEventListener('focus', onFocus);
		}
		void tick();
		return () => {
			cancelled = true;
			clearInterval(timer);
			if (typeof document !== 'undefined') {
				document.removeEventListener('visibilitychange', onFocus);
				window.removeEventListener('focus', onFocus);
			}
		};
	}, [activeId, loadConversations]);

	useEffect(() => {
		if (sidebarView !== 'phones' || phonesPanel !== 'activity') return;
		metaWhatsAppApi.activity(40).then(rows => setActivity(Array.isArray(rows) ? rows : [])).catch(() => setActivity([]));
	}, [sidebarView, phonesPanel]);

	const loadUsageBilling = useCallback(async () => {
		const epoch = dataEpochRef.current;
		setUsageLoading(true);
		setUsageError(null);
		try {
			const data = await metaWhatsAppApi.usageBilling();
			if (epoch !== dataEpochRef.current) return;
			setUsageData(data);
		} catch (err) {
			if (epoch !== dataEpochRef.current) return;
			setUsageError(err?.message || t.usageLoadError);
			setUsageData(null);
		} finally {
			if (epoch === dataEpochRef.current) setUsageLoading(false);
		}
	}, [t.usageLoadError]);

	useEffect(() => {
		if (sidebarView !== 'usage') return;
		void loadUsageBilling();
	}, [sidebarView, loadUsageBilling, demoMode]);

	const loadTemplates = useCallback(async () => {
		const epoch = dataEpochRef.current;
		setTemplatesLoading(true);
		setTemplatesError(null);
		try {
			const rows = await metaWhatsAppApi.templates();
			if (epoch !== dataEpochRef.current) return;
			setTemplates(Array.isArray(rows) ? rows : []);
		} catch (err) {
			if (epoch !== dataEpochRef.current) return;
			setTemplates([]);
			setTemplatesError(apiErrorMessage(err, t.templateLoadError));
		} finally {
			if (epoch === dataEpochRef.current) setTemplatesLoading(false);
		}
	}, [t.templateLoadError]);

	useEffect(() => {
		if (!status?.hasAccessToken || !status?.wabaId) return;
		void loadTemplates();
	}, [status?.hasAccessToken, status?.wabaId, demoMode, loadTemplates]);

	useEffect(() => {
		if (sidebarView === 'templates') void loadTemplates();
		if (sidebarView === 'phones') void loadAccounts();
	}, [sidebarView, loadTemplates, loadAccounts, demoMode]);

	const filtered = useMemo(() => conversations, [conversations]);

	const canSendFreeform = hasOpenCustomerCareWindow(messages, active);

	const approvedTemplates = useMemo(
		() =>
			templates.filter(x => String(x.status || '').toUpperCase() === 'APPROVED'),
		[templates],
	);

	const selectedTemplate = useMemo(() => {
		if (!selectedTemplateKey) return null;
		return (
			templates.find(x => `${x.name}::${x.language}` === selectedTemplateKey) || null
		);
	}, [selectedTemplateKey, templates]);

	const selectedPlaceholders = useMemo(
		() => extractTemplatePlaceholders(selectedTemplate?.components),
		[selectedTemplate],
	);

	const connectionLabel =
		status?.connectionStatus === 'connected'
			? t.connected
			: status?.connectionStatus === 'error'
				? t.error
				: t.disconnected;

	function onSearchChange(value) {
		setQ(value);
		clearTimeout(searchTimer.current);
		searchTimer.current = setTimeout(() => {
			void loadConversations(value, filterRef.current, { silent: false });
		}, 300);
	}

	function onFilterChange(nextFilter) {
		if (nextFilter === filter) return;
		setFilter(nextFilter);
		void loadConversations(qRef.current, nextFilter, { silent: false });
	}

	function missingConnectionFields(nextStatus = status, nextForm = form) {
		const missing = [];
		if (!nextForm.phoneNumberId?.trim() && !nextStatus?.phoneNumberId) missing.push(t.phoneNumberId);
		if (!nextForm.wabaId?.trim() && !nextStatus?.wabaId) missing.push(t.wabaId);
		if (!nextForm.verifyToken?.trim() && !nextStatus?.verifyToken && !nextStatus?.hasVerifyToken) {
			missing.push(t.verifyToken);
		}
		if (!nextForm.accessToken?.trim() && !nextStatus?.hasAccessToken) missing.push(t.accessToken);
		if (!nextForm.appSecret?.trim() && !nextStatus?.hasAppSecret) missing.push(t.appSecret);
		return missing;
	}

	function apiErrorMessage(err, fallback = t.loadError) {
		const data = err?.response?.data;
		const status = err?.response?.status;
		const parts = [];

		const push = value => {
			const s = String(value || '').trim();
			if (s && !parts.includes(s)) parts.push(s);
		};

		const walk = value => {
			if (value == null) return;
			if (typeof value === 'string') {
				push(value);
				return;
			}
			if (Array.isArray(value)) {
				value.forEach(walk);
				return;
			}
			if (typeof value === 'object') {
				walk(value.message);
				walk(value.details);
				walk(value.error_user_msg);
				walk(value.error_user_title);
				walk(value.error);
				if (value.error_data) walk(value.error_data.details);
			}
		};

		walk(data?.message);
		walk(data?.error);
		walk(data?.details);
		if (!parts.length) walk(data);
		if (!parts.length) walk(err?.message);
		if (!parts.length) walk(err?.error);

		if (!parts.length) return fallback;
		const joined = parts.join(' — ');
		if (status && status !== 400 && !joined.includes(String(status))) {
			return `${joined} (HTTP ${status})`;
		}
		return joined;
	}

	async function persistConfig() {
		const payload = {
			phoneNumberId: form.phoneNumberId.trim(),
			wabaId: form.wabaId.trim(),
		};
		if (form.accessToken.trim()) payload.accessToken = form.accessToken.trim();
		if (form.verifyToken.trim()) payload.verifyToken = form.verifyToken.trim();
		if (form.appSecret.trim()) payload.appSecret = form.appSecret.trim();
		const data = await metaWhatsAppApi.saveConfig(payload);
		setStatus(data);
		const next = {
			accessToken: data.accessToken || form.accessToken || '',
			appSecret: data.appSecret || form.appSecret || '',
			phoneNumberId: data.phoneNumberId || form.phoneNumberId || '',
			wabaId: data.wabaId || form.wabaId || '',
			verifyToken: data.verifyToken || form.verifyToken || '',
		};
		setForm(next);
		return data;
	}

	async function onSave(e) {
		e?.preventDefault?.();
		setSaving(true);
		setFlash(null);
		try {
			if (!form.phoneNumberId.trim()) {
				setFlash(`${t.missingRequired}: ${t.phoneNumberId}`);
				return;
			}
			await persistConfig();
			setFlash(t.saveOk);
		} catch (err) {
			setFlash(apiErrorMessage(err));
		} finally {
			setSaving(false);
		}
	}

	async function onValidate() {
		setValidating(true);
		setFlash(null);
		try {
			const missing = missingConnectionFields();
			if (missing.length) {
				setFlash(`${t.missingRequired}: ${missing.join(', ')}`);
				return;
			}
			const saved = await persistConfig();
			const stillMissing = missingConnectionFields(saved);
			if (stillMissing.length) {
				setFlash(`${t.missingRequired}: ${stillMissing.join(', ')}`);
				return;
			}
			const data = await metaWhatsAppApi.validate();
			const nextStatus = data.status || data;
			setStatus(nextStatus);
			if (nextStatus?.wabaId || data.wabaId) {
				const resolvedWaba = nextStatus?.wabaId || data.wabaId;
				setForm(f => ({ ...f, wabaId: resolvedWaba }));
			}
			setFlash(
				data.wabaAutoResolved
					? `${t.validateOk} — WABA auto-fixed`
					: t.validateOk,
			);
		} catch (err) {
			setFlash(apiErrorMessage(err));
			await loadStatus().catch(() => {});
		} finally {
			setValidating(false);
		}
	}

	async function onToggleEnabled() {
		setFlash(null);
		const enabling = !status?.enabled;
		try {
			if (enabling) {
				const missing = missingConnectionFields();
				if (missing.length) {
					setFlash(`${t.missingRequired}: ${missing.join(', ')}`);
					return;
				}
				await persistConfig();
			}
			const data = await metaWhatsAppApi.setEnabled(enabling);
			setStatus(data);
		} catch (err) {
			setFlash(apiErrorMessage(err));
		}
	}

	async function onDeleteAccount() {
		if (!status?.id) return;
		if (!window.confirm(t.deletePhoneConfirm)) return;
		setPhoneMenuOpen(false);
		setFlash(null);
		try {
			await metaWhatsAppApi.deleteAccount(status.id);
			setWhatsAppConfigId('');
			await loadAccounts();
			await bootstrap();
			setFlash(t.deletePhone);
		} catch (err) {
			setFlash(apiErrorMessage(err));
		}
	}

	async function copyActivePhone() {
		const value = status?.displayPhoneNumber || status?.phoneNumberId || '';
		if (!value) return;
		try {
			await navigator.clipboard.writeText(String(value));
			setFlash(t.copyNumber);
		} catch {
			setFlash(t.sendError);
		}
		setPhoneMenuOpen(false);
	}

	async function selectConversation(id) {
		setActiveId(id);
		setMessageTranslations({});
		await loadMessages(id);
	}

	function closeActiveChat() {
		setActiveId(null);
		setActive(null);
		setMessages([]);
		setDraft('');
		setMessageTranslations({});
	}

	async function toggleFavorite(conversation) {
		if (!conversation?.id) return;
		const next = !conversation.isFavorite;
		setConversations(current =>
			current.map(item => (item.id === conversation.id ? { ...item, isFavorite: next } : item)),
		);
		if (active?.id === conversation.id) {
			setActive(current => (current ? { ...current, isFavorite: next } : current));
		}
		try {
			const data = await metaWhatsAppApi.setConversationFavorite(conversation.id, next);
			setConversations(current =>
				current.map(item => (item.id === conversation.id ? { ...item, ...data } : item)),
			);
			if (active?.id === conversation.id) setActive(data);
			setFlash(t.favoriteUpdated);
		} catch (err) {
			setConversations(current =>
				current.map(item =>
					item.id === conversation.id ? { ...item, isFavorite: !next } : item,
				),
			);
			if (active?.id === conversation.id) {
				setActive(current => (current ? { ...current, isFavorite: !next } : current));
			}
			setFlash(apiErrorMessage(err, t.favoriteFailed));
		}
	}

	async function onSyncFromMeta() {
		setFlash(null);
		setSyncingMeta(true);
		try {
			const report = await metaWhatsAppApi.syncFromMeta();
			setSyncReport(report);
			setFlash(t.syncHint);
			await loadConversations();
			if (activeId) await loadMessages(activeId);
		} catch (err) {
			setFlash(apiErrorMessage(err, t.loadError));
		} finally {
			setSyncingMeta(false);
		}
	}

	async function onImportWebhookFile(file) {
		if (!file) return;
		setFlash(null);
		setImportingWebhooks(true);
		try {
			const result = await metaWhatsAppApi.importWebhookDump(file);
			setWebhookImportResult(result);
			setFlash(t.syncImportOk);
			await loadConversations();
			if (activeId) await loadMessages(activeId);
		} catch (err) {
			setFlash(apiErrorMessage(err, t.loadError));
		} finally {
			setImportingWebhooks(false);
		}
	}

	async function onOpenPhone(waId, displayName) {
		if (!waId) return false;
		setOpeningPhone(true);
		try {
			const conv = await metaWhatsAppApi.openPhone(waId, displayName || undefined);
			setFlash(conv.metaHistoryNote || null);
			await loadConversations();
			await selectConversation(conv.id);
			return true;
		} catch (err) {
			setFlash(typeof err?.message === 'string' ? err.message : t.phoneInvalid);
			return false;
		} finally {
			setOpeningPhone(false);
		}
	}

	function revalidateImportRows(rows) {
		const seen = new Map();
		return rows.map((raw, index) => {
			const phone = String(raw.phone || '').trim();
			const displayName = String(raw.displayName || '').trim();
			const row = raw.row || index + 2;
			if (!phone) {
				return { row, phone, displayName, waId: null, ok: false, error: t.phoneRequired };
			}
			const waId = normalizeWaPhone(phone);
			if (!waId) {
				return { row, phone, displayName, waId: null, ok: false, error: t.phoneInvalid };
			}
			const prev = seen.get(waId);
			if (prev) {
				return {
					row,
					phone,
					displayName,
					waId,
					ok: false,
					error: isAr ? `مكرر مع الصف ${prev}` : `Duplicate of row ${prev}`,
				};
			}
			seen.set(waId, row);
			return { row, phone, displayName, waId, ok: true, error: null };
		});
	}

	async function onDownloadPhoneTemplate() {
		try {
			await metaWhatsAppApi.downloadPhoneTemplate();
		} catch (err) {
			setFlash(apiErrorMessage(err, t.loadError));
		}
	}

	async function onUploadPhoneFile(file) {
		setImportBusy(true);
		try {
			const data = await metaWhatsAppApi.previewPhoneImport(file);
			const rows = revalidateImportRows(Array.isArray(data?.rows) ? data.rows : []);
			if (!rows.length) {
				setFlash(t.importEmptyFile);
				return;
			}
			setImportRows(rows);
			setImportOpen(true);
		} catch (err) {
			setFlash(apiErrorMessage(err, t.loadError));
		} finally {
			setImportBusy(false);
		}
	}

	async function onSaveImportedPhones() {
		const current = revalidateImportRows(importRows);
		setImportRows(current);
		const valid = current.filter(r => r.ok && r.waId);
		if (!valid.length) return;
		setImportBusy(true);
		try {
			let lastId = null;
			for (const row of valid) {
				const conv = await metaWhatsAppApi.openPhone(row.waId, row.displayName || undefined);
				lastId = conv?.id || lastId;
			}
			setFlash(t.importOpened);
			await loadConversations();
			if (lastId) await selectConversation(lastId);
			const remaining = current.filter(r => !r.ok);
			if (remaining.length) setImportRows(remaining);
			else {
				setImportOpen(false);
				setImportRows([]);
			}
		} catch (err) {
			setFlash(apiErrorMessage(err, t.phoneInvalid));
		} finally {
			setImportBusy(false);
		}
	}

	async function openChatFromPhoneNumber(waId, displayHint) {
		if (!waId || openingChatPhone) return;
		setOpeningChatPhone(true);
		setFlash(t.openPhoneFromChat);
		try {
			const conv = await metaWhatsAppApi.openPhone(waId, displayHint || undefined);
			setFlash(null);
			await loadConversations();
			await selectConversation(conv.id);
		} catch (err) {
			setFlash(err?.message || t.phoneInvalid);
		} finally {
			setOpeningChatPhone(false);
		}
	}

	async function toggleMessageTranslation(message) {
		const id = message?.id;
		if (!id) return;
		const existing = messageTranslations[id];
		if (existing?.open && existing.text) {
			setMessageTranslations(prev => ({
				...prev,
				[id]: { ...prev[id], open: false },
			}));
			return;
		}
		if (existing?.text && !existing.error) {
			setMessageTranslations(prev => ({
				...prev,
				[id]: { ...prev[id], open: true, error: null },
			}));
			return;
		}

		const text = getMessageTranslateText(message, templates);
		if (!text) return;
		const targetLang = detectTranslateTarget(text);

		setMessageTranslations(prev => ({
			...prev,
			[id]: {
				...(prev[id] || {}),
				open: true,
				loading: true,
				error: null,
				targetLang,
			},
		}));

		try {
			const result = await metaWhatsAppApi.translate(text, targetLang);
			setMessageTranslations(prev => ({
				...prev,
				[id]: {
					open: true,
					loading: false,
					text: String(result?.translatedText || '').trim(),
					sourceLang: result?.sourceLang || (targetLang === 'ar' ? 'en' : 'ar'),
					targetLang: result?.targetLang || targetLang,
					error: null,
				},
			}));
		} catch (err) {
			const msg = err?.message;
			setMessageTranslations(prev => ({
				...prev,
				[id]: {
					...(prev[id] || {}),
					open: true,
					loading: false,
					error: typeof msg === 'string' ? msg : t.translateFailed,
				},
			}));
		}
	}

	async function loadQuickReplies() {
		setQuickRepliesLoading(true);
		try {
			const rows = await metaWhatsAppApi.listQuickReplies();
			setQuickReplies(Array.isArray(rows) ? rows : []);
		} catch {
			setQuickReplies([]);
		} finally {
			setQuickRepliesLoading(false);
		}
	}

	async function openQuickReplies() {
		setQuickRepliesOpen(true);
		setQuickReplyFormOpen(false);
		await loadQuickReplies();
	}

	function useQuickReply(reply) {
		if (!reply?.body) return;
		setDraft(String(reply.body));
		setQuickRepliesOpen(false);
	}

	async function saveQuickReply(e) {
		e?.preventDefault?.();
		const title = quickReplyTitle.trim();
		const body = quickReplyBody.trim() || draft.trim();
		if (!title || !body) {
			setFlash(isAr ? 'العنوان والنص مطلوبان' : 'Title and reply text are required');
			return;
		}
		setQuickReplySaving(true);
		try {
			await metaWhatsAppApi.createQuickReply({ title, body });
			setQuickReplyTitle('');
			setQuickReplyBody('');
			setQuickReplyFormOpen(false);
			setFlash(t.fastReplySaved);
			await loadQuickReplies();
		} catch (err) {
			setFlash(apiErrorMessage(err, t.loadError));
		} finally {
			setQuickReplySaving(false);
		}
	}

	async function deleteQuickReply(id) {
		if (!id) return;
		try {
			await metaWhatsAppApi.deleteQuickReply(id);
			setFlash(t.fastReplyDeleted);
			await loadQuickReplies();
		} catch (err) {
			setFlash(apiErrorMessage(err, t.loadError));
		}
	}

	async function onSendText(e) {
		e.preventDefault();
		if (!activeId || !draft.trim()) return;
		setSending(true);
		try {
			await metaWhatsAppApi.sendText({ conversationId: activeId, text: draft.trim() });
			setDraft('');
			await loadMessages(activeId);
			await loadConversations();
		} catch (err) {
			setFlash(apiErrorMessage(err, t.sendError));
		} finally {
			setSending(false);
		}
	}

	async function onSendTemplate(e) {
		e?.preventDefault?.();
		if (!activeId || !selectedTemplate) return;
		const fieldErrors = validateTemplateSendValues(
			selectedPlaceholders,
			templateVarValues,
			t,
		);
		setTemplateVarErrors(fieldErrors);
		if (Object.keys(fieldErrors).length) {
			setFlash(Object.values(fieldErrors)[0]);
			return;
		}
		setSending(true);
		setFlash(null);
		try {
			const components = buildTemplateSendComponents(
				selectedPlaceholders,
				templateVarValues,
			);
			await metaWhatsAppApi.sendTemplate({
				conversationId: activeId,
				templateName: selectedTemplate.name,
				language: selectedTemplate.language || 'en',
				components,
			});
			setSendTemplateOpen(false);
			setSelectedTemplateKey('');
			setTemplateVarValues({});
			setTemplateVarErrors({});
			setTemplateName('');
			await loadMessages(activeId);
			await loadConversations();
		} catch (err) {
			setFlash(apiErrorMessage(err, t.sendError));
		} finally {
			setSending(false);
		}
	}

	async function onCreateTemplate(e) {
		e.preventDefault();
		const isEditing = Boolean(editingTemplateId);
		const keepExistingMedia =
			isEditing &&
			['IMAGE', 'VIDEO', 'DOCUMENT'].includes(String(createForm.headerFormat || '').toUpperCase()) &&
			Boolean(existingHeaderComponent) &&
			!headerSampleFile;
		const errors = validateCreateTemplateForm(createForm, t, {
			hasHeaderSample: Boolean(
				headerSampleFile || createForm.headerHandle || keepExistingMedia,
			),
		});
		setCreateFormErrors(errors);
		if (Object.keys(errors).length) {
			setCreateFormErrors({ ...errors, form: Object.values(errors)[0] });
			return;
		}
		setCreatingTemplate(true);
		setFlash(null);
		setCreateFormErrors({});
		try {
			const safeName = createForm.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
			const headerFormat = String(createForm.headerFormat || 'NONE').toUpperCase();
			let headerHandle = createForm.headerHandle || undefined;
			if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat) && headerSampleFile) {
				const uploaded = await metaWhatsAppApi.uploadTemplateHeader(headerSampleFile);
				headerHandle = uploaded?.headerHandle;
				if (!headerHandle) throw new Error(t.headerSampleRequired);
			}
			const payload = {
				headerFormat,
				headerText:
					headerFormat === 'TEXT' ? createForm.headerText.trim() || undefined : undefined,
				headerHandle: ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat)
					? headerHandle
					: undefined,
				existingHeaderComponent:
					keepExistingMedia && !headerHandle ? existingHeaderComponent : undefined,
				bodyText: createForm.bodyText.trim(),
				footerText: createForm.footerText.trim() || undefined,
				buttons: (createForm.buttons || [])
					.filter(b => String(b.text || '').trim())
					.map(b => ({
						type: b.type,
						text: String(b.text).trim(),
						url: b.url?.trim() || undefined,
						phone_number: b.phone_number?.trim() || undefined,
					})),
				exampleBodyParams: exampleParamsFromText(createForm.bodyText),
				exampleHeaderParams:
					headerFormat === 'TEXT' ? exampleParamsFromText(createForm.headerText) : undefined,
			};
			if (isEditing) {
				// Meta rejects category changes on APPROVED templates (#100).
				await metaWhatsAppApi.updateTemplate(editingTemplateId, payload);
				setFlash(t.templateEditOk);
			} else {
				const { existingHeaderComponent: _keep, ...createPayload } = payload;
				await metaWhatsAppApi.createTemplate({
					...createPayload,
					category: createForm.category,
					name: safeName,
					language: createForm.language.trim() || 'en_US',
				});
				setFlash(t.templateCreateOk);
			}
			resetCreateTemplate();
			setTemplatesMode('list');
			await loadTemplates();
		} catch (err) {
			const message = apiErrorMessage(err, t.sendError);
			setCreateFormErrors(mapMetaTemplateErrorToFields(message, t));
			setFlash(message);
		} finally {
			setCreatingTemplate(false);
		}
	}

	function resetCreateTemplate() {
		setCreateForm(emptyCreateTemplateForm(isAr));
		setEditingTemplateId('');
		setExistingHeaderComponent(null);
		setHeaderSampleFile(null);
		if (headerSamplePreview) URL.revokeObjectURL(headerSamplePreview);
		setHeaderSamplePreview('');
		setCreateFormErrors({});
		setFlash(null);
	}

	function openEditTemplate(tpl) {
		if (!canEditMetaTemplate(tpl)) {
			setFlash(t.templateCannotEdit);
			return;
		}
		const headerFormat = templateHeaderFormat(tpl.components) || 'NONE';
		setCreateForm(formFromMetaTemplate(tpl, isAr));
		setEditingTemplateId(String(tpl.id));
		setExistingHeaderComponent(
			['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat)
				? templateHeaderComponent(tpl.components)
				: null,
		);
		setHeaderSampleFile(null);
		if (headerSamplePreview) URL.revokeObjectURL(headerSamplePreview);
		setHeaderSamplePreview('');
		setCreateFormErrors({});
		setPreviewTemplate(null);
		setTemplatesMode('create');
		setFlash(null);
	}

	function onHeaderSamplePick(file) {
		if (!file) return;
		setHeaderSampleFile(file);
		setExistingHeaderComponent(null);
		if (headerSamplePreview) URL.revokeObjectURL(headerSamplePreview);
		if (String(file.type || '').startsWith('image/')) {
			setHeaderSamplePreview(URL.createObjectURL(file));
		} else {
			setHeaderSamplePreview('');
		}
		setCreateFormErrors(err => ({ ...err, headerSample: undefined }));
	}

	function insertBodyVar() {
		const existing = [
			...String(createForm.bodyText || '').matchAll(/\{\{\s*(\d+)\s*\}\}/g),
		].map(m => Number(m[1]));
		const next = existing.length ? Math.max(...existing) + 1 : 1;
		setCreateForm(f => ({ ...f, bodyText: `${f.bodyText}{{${next}}}` }));
		setCreateFormErrors(err => ({ ...err, bodyText: undefined }));
	}

	function addTemplateButton(type = 'QUICK_REPLY') {
		setCreateForm(f => {
			if ((f.buttons || []).length >= 10) return f;
			return {
				...f,
				buttons: [
					...(f.buttons || []),
					{ id: nextButtonId(), type, text: '', url: '', phone_number: '' },
				],
			};
		});
	}

	async function loadSeedTemplates() {
		setSeedLoading(true);
		setTemplatesError(null);
		try {
			const data = await metaWhatsAppApi.seedTemplates();
			const rows = Array.isArray(data?.templates) ? data.templates : [];
			setSeedTemplates(rows);
			setSeedNote(data?.note || '');
			const next = {};
			rows.forEach(row => {
				next[row.key] = true;
			});
			setSeedSelected(next);
			setTemplatesMode('seed');
		} catch (err) {
			setTemplatesError(apiErrorMessage(err, t.templateLoadError));
		} finally {
			setSeedLoading(false);
		}
	}

	async function submitSeedTemplates(all = false) {
		const keys = all
			? seedTemplates.map(s => s.key)
			: Object.keys(seedSelected).filter(k => seedSelected[k]);
		if (!keys.length) {
			setFlash(t.templatePick);
			return;
		}
		setSeedSubmitting(true);
		setFlash(null);
		setTemplatesError(null);
		try {
			const data = await metaWhatsAppApi.submitSeedTemplates({ keys });
			const failed = data?.results?.filter(r => !r.ok) || [];
			if (failed.length) {
				setFlash(
					failed.map(f => `${f.name}: ${f.error || 'failed'}`).join(' | ') ||
						t.sendError,
				);
			} else {
				setFlash(
					`${t.seedSubmitted} (${data?.submitted || keys.length}) — pending Meta review`,
				);
			}
			await loadTemplates();
		} catch (err) {
			setFlash(apiErrorMessage(err, t.sendError));
		} finally {
			setSeedSubmitting(false);
		}
	}

	async function cloneOutreachAsUtility() {
		setSeedSubmitting(true);
		setFlash(null);
		setTemplatesError(null);
		try {
			const data = await metaWhatsAppApi.cloneTemplates({
				names: ['so7ba_fitness_outreach_ar', 'so7ba_fitness_outreach_en'],
				category: 'UTILITY',
				nameMap: {
					so7ba_fitness_outreach_ar: 'so7ba_fitness_util_ar',
					so7ba_fitness_outreach_en: 'so7ba_fitness_util_en',
				},
			});
			const failed = data?.results?.filter(r => !r.ok) || [];
			if (failed.length) {
				setFlash(
					failed
						.map(f => `${f.sourceName}: ${f.error || 'failed'}`)
						.join(' | ') || t.sendError,
				);
			} else {
				const names = (data?.results || [])
					.filter(r => r.ok)
					.map(r => r.newName)
					.join(', ');
				setFlash(
					`${t.cloneAsUtilityOk}${names ? `: ${names}` : ''} — pending Meta review`,
				);
			}
			await loadTemplates();
		} catch (err) {
			setFlash(apiErrorMessage(err, t.sendError));
		} finally {
			setSeedSubmitting(false);
		}
	}

	async function loadMetaLibrary(search = librarySearch) {
		setLibraryOpen(true);
		setLibraryLoading(true);
		setFlash(null);
		setTemplatesError(null);
		try {
			const data = await metaWhatsAppApi.templateLibrary({
				search: search?.trim() || undefined,
				language: isAr ? 'ar' : undefined,
			});
			setLibraryVerification(Array.isArray(data?.verification) ? data.verification : []);
			setLibraryItems(Array.isArray(data?.templates) ? data.templates : []);
		} catch (err) {
			setFlash(apiErrorMessage(err, t.metaLibraryLoadError));
		} finally {
			setLibraryLoading(false);
		}
	}

	function openVerifySend(tpl) {
		if (!tpl?.name) return;
		setFlash(null);
		setVerifyTemplate({
			name: tpl.name,
			language: tpl.language || 'en_US',
			components: tpl.components || null,
			body: tpl.body || templatePreviewText(tpl.components) || '',
			isVerification: Boolean(tpl.isVerification),
		});
		setVerifyPhone(active?.waId || '');
		setTemplateVarValues({});
		setVerifyOpen(true);
	}

	async function copyTemplateName(name) {
		try {
			await navigator.clipboard.writeText(String(name || ''));
			setFlash(t.templateCopied);
		} catch {
			setFlash(t.sendError);
		}
	}

	async function onDeleteTemplate(tpl) {
		if (!tpl?.name) return;
		const key = `${tpl.id || tpl.name}::${tpl.language || ''}`;
		if (!window.confirm(t.templateDeleteConfirm)) return;
		setDeletingTemplateKey(key);
		setFlash(null);
		try {
			await metaWhatsAppApi.deleteTemplate({
				name: tpl.name,
				...(tpl.id ? { hsmId: tpl.id } : {}),
			});
			setFlash(t.templateDeleted);
			if (previewTemplate?.name === tpl.name) setPreviewTemplate(null);
			await loadTemplates();
		} catch (err) {
			setFlash(apiErrorMessage(err, t.sendError));
		} finally {
			setDeletingTemplateKey('');
		}
	}

	async function onAddFromLibrary(item) {
		const libraryName = item?.libraryTemplateName || item?.name;
		if (!libraryName) return;
		const key = `${libraryName}::${item.language || 'en_US'}`;
		setLibraryCreatingKey(key);
		setFlash(null);
		try {
			const slug = String(libraryName)
				.toLowerCase()
				.replace(/[^a-z0-9_]+/g, '_')
				.slice(0, 40);
			const buttons = item.buttons || item.raw?.buttons || [];
			await metaWhatsAppApi.createFromLibrary({
				name: `${slug}_${Date.now().toString(36).slice(-4)}`,
				language: item.language || (isAr ? 'ar' : 'en_US'),
				category: item.category || 'UTILITY',
				libraryTemplateName: libraryName,
				buttons,
				buttonUrl: status?.webhookCallbackUrl
					? (() => {
							try {
								return new URL(status.webhookCallbackUrl).origin;
							} catch {
								return undefined;
							}
						})()
					: undefined,
				buttonPhone: status?.displayPhoneNumber || undefined,
			});
			setFlash(t.libraryAdded);
			await loadTemplates();
		} catch (err) {
			setFlash(apiErrorMessage(err, t.sendError));
		} finally {
			setLibraryCreatingKey('');
		}
	}

	async function onVerifySend(e) {
		e?.preventDefault?.();
		if (!verifyTemplate?.name) return;
		const raw = String(verifyPhone || '').trim();
		if (!raw) {
			setFlash(t.phoneRequired);
			return;
		}
		const waId = normalizeWaPhone(raw);
		if (!waId) {
			setFlash(t.phoneInvalid);
			return;
		}
		const placeholders = extractTemplatePlaceholders(verifyTemplate.components);
		const fieldErrors = validateTemplateSendValues(placeholders, templateVarValues, t);
		setTemplateVarErrors(fieldErrors);
		if (Object.keys(fieldErrors).length) {
			setFlash(Object.values(fieldErrors)[0]);
			return;
		}
		setSending(true);
		setFlash(null);
		try {
			const components = buildTemplateSendComponents(placeholders, templateVarValues);
			await metaWhatsAppApi.sendTemplate({
				phone: waId,
				templateName: verifyTemplate.name,
				language: verifyTemplate.language || 'en_US',
				components,
			});
			setVerifyOpen(false);
			setVerifyTemplate(null);
			setTemplateVarErrors({});
			setFlash(t.verifySendOk);
			await loadConversations();
			if (activeId) await loadMessages(activeId);
		} catch (err) {
			setFlash(apiErrorMessage(err, t.sendError));
		} finally {
			setSending(false);
		}
	}

	function openSendTemplate() {
		setFlash(null);
		setTemplateVarErrors({});
		setSendTemplateOpen(true);
		void loadTemplates();
	}

	async function uploadFile(file, { asVoice = false, caption = '' } = {}) {
		if (!activeId || !file) return;
		setSending(true);
		setFlash(null);
		try {
			await metaWhatsAppApi.sendMedia({
				conversationId: activeId,
				file,
				caption,
				asVoice,
			});
			await loadMessages(activeId);
			await loadConversations();
		} catch (err) {
			setFlash(apiErrorMessage(err, t.sendError));
		} finally {
			setSending(false);
		}
	}

	function stopRecordingMeter() {
		if (recordingRafRef.current) {
			cancelAnimationFrame(recordingRafRef.current);
			recordingRafRef.current = 0;
		}
	}

	function freezeElapsed() {
		if (!recordingStartedAtRef.current) return;
		recordingElapsedMsRef.current += Date.now() - recordingStartedAtRef.current;
		recordingStartedAtRef.current = 0;
		setRecordingSeconds(Math.floor(recordingElapsedMsRef.current / 1000));
	}

	function startRecordingMeter() {
		stopRecordingMeter();
		const analyser = recordingAnalyserRef.current;
		const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
		const tick = () => {
			const live = recordingStartedAtRef.current
				? recordingElapsedMsRef.current + (Date.now() - recordingStartedAtRef.current)
				: recordingElapsedMsRef.current;
			setRecordingSeconds(Math.floor(live / 1000));
			if (analyser && data) {
				analyser.getByteFrequencyData(data);
				let sum = 0;
				for (let i = 0; i < data.length; i += 1) sum += data[i];
				const avg = sum / (data.length || 1) / 255;
				setRecordingLevel(Math.max(0.12, Math.min(1, avg * 1.8)));
			} else {
				setRecordingLevel(0.25 + Math.random() * 0.55);
			}
			recordingRafRef.current = requestAnimationFrame(tick);
		};
		recordingRafRef.current = requestAnimationFrame(tick);
	}

	function cleanupRecordingMeters() {
		stopRecordingMeter();
		try {
			recordingAudioCtxRef.current?.close?.();
		} catch {
			/* ignore */
		}
		recordingAudioCtxRef.current = null;
		recordingAnalyserRef.current = null;
		recordingElapsedMsRef.current = 0;
		recordingStartedAtRef.current = 0;
		setRecordingLevel(0.2);
		setRecordingSeconds(0);
		setRecordingPaused(false);
	}

	async function startRecording() {
		if (!canSendFreeform) {
			setFlash(t.windowClosed);
			return;
		}
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
			setFlash(isAr ? 'المتصفح لا يدعم تسجيل الصوت' : 'Browser does not support voice recording');
			return;
		}
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					channelCount: 1,
				},
			});
			const preferred = [
				'audio/ogg;codecs=opus',
				'audio/webm;codecs=opus',
				'audio/webm',
				'audio/mp4',
			];
			const mimeType =
				preferred.find(tp => {
					try {
						return MediaRecorder.isTypeSupported(tp);
					} catch {
						return false;
					}
				}) || '';
			const recorder = mimeType
				? new MediaRecorder(stream, { mimeType })
				: new MediaRecorder(stream);
			chunksRef.current = [];
			heldVoiceRef.current = null;
			recordingIntentRef.current = 'discard';
			recorder.ondataavailable = ev => {
				if (ev.data?.size) chunksRef.current.push(ev.data);
			};
			recorder.onerror = () => {
				stream.getTracks().forEach(tr => tr.stop());
				cleanupRecordingMeters();
				setRecording(false);
				setRecordingReady(false);
				setFlash(isAr ? 'فشل تسجيل الصوت' : 'Voice recording failed');
			};
			recorder.onstop = async () => {
				stream.getTracks().forEach(tr => tr.stop());
				const intent = recordingIntentRef.current;
				const keptMs = recordingElapsedMsRef.current;
				recordingIntentRef.current = 'discard';
				cleanupRecordingMeters();
				if (intent === 'discard') {
					heldVoiceRef.current = null;
					setRecording(false);
					setRecordingReady(false);
					return;
				}
				const type = recorder.mimeType || mimeType || 'audio/webm';
				const blob = new Blob(chunksRef.current, { type });
				if (!blob.size) {
					setRecording(false);
					setRecordingReady(false);
					setFlash(isAr ? 'التسجيل فاضي — جرب تاني' : 'Empty recording — try again');
					return;
				}
				const ext = type.includes('ogg') ? 'ogg' : type.includes('mp4') ? 'm4a' : 'webm';
				const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type || type });
				if (intent === 'hold') {
					heldVoiceRef.current = file;
					setRecordingSeconds(Math.max(0, Math.floor(keptMs / 1000)));
					setRecordingReady(true);
					setRecordingPaused(false);
					setRecording(true);
					return;
				}
				heldVoiceRef.current = null;
				setRecording(false);
				setRecordingReady(false);
				try {
					await uploadFile(file, { asVoice: true });
				} catch {
					/* uploadFile already flashes */
				}
			};
			mediaRecorderRef.current = recorder;
			recorder.start(250);

			recordingElapsedMsRef.current = 0;
			recordingStartedAtRef.current = Date.now();
			setRecordingSeconds(0);
			setRecordingPaused(false);
			setRecordingReady(false);
			try {
				const Ctx = window.AudioContext || window.webkitAudioContext;
				if (Ctx) {
					const ctx = new Ctx();
					const source = ctx.createMediaStreamSource(stream);
					const analyser = ctx.createAnalyser();
					analyser.fftSize = 256;
					source.connect(analyser);
					recordingAudioCtxRef.current = ctx;
					recordingAnalyserRef.current = analyser;
				}
			} catch {
				recordingAudioCtxRef.current = null;
				recordingAnalyserRef.current = null;
			}
			startRecordingMeter();

			setRecording(true);
			setFlash(null);
		} catch (err) {
			const name = String(err?.name || '');
			setFlash(
				name === 'NotAllowedError' || name === 'PermissionDeniedError'
					? isAr
						? 'اسمح بالوصول للميكروفون من إعدادات المتصفح'
						: 'Allow microphone access in browser settings'
					: isAr
						? 'لا يمكن الوصول للميكروفون'
						: 'Microphone permission denied',
			);
		}
	}

	function pauseRecording() {
		const recorder = mediaRecorderRef.current;
		if (!recorder || recorder.state !== 'recording' || recordingReady) return;
		try {
			recorder.pause();
		} catch {
			return;
		}
		freezeElapsed();
		stopRecordingMeter();
		try {
			recordingAudioCtxRef.current?.suspend?.();
		} catch {
			/* ignore */
		}
		setRecordingPaused(true);
	}

	function resumeRecording() {
		const recorder = mediaRecorderRef.current;
		if (!recorder || recorder.state !== 'paused' || recordingReady) return;
		try {
			recorder.resume();
		} catch {
			return;
		}
		recordingStartedAtRef.current = Date.now();
		try {
			recordingAudioCtxRef.current?.resume?.();
		} catch {
			/* ignore */
		}
		setRecordingPaused(false);
		startRecordingMeter();
	}

	function stopRecordingHold() {
		const recorder = mediaRecorderRef.current;
		if (recordingReady) return;
		if (!recorder || recorder.state === 'inactive') return;
		freezeElapsed();
		stopRecordingMeter();
		recordingIntentRef.current = 'hold';
		try {
			recorder.requestData?.();
		} catch {
			/* ignore */
		}
		recorder.stop();
	}

	function stopRecording() {
		if (recordingReady && heldVoiceRef.current) {
			const file = heldVoiceRef.current;
			heldVoiceRef.current = null;
			setRecording(false);
			setRecordingReady(false);
			setRecordingPaused(false);
			void uploadFile(file, { asVoice: true });
			return;
		}
		const recorder = mediaRecorderRef.current;
		recordingIntentRef.current = 'send';
		if (recorder && recorder.state !== 'inactive') {
			try {
				recorder.requestData?.();
			} catch {
				/* ignore */
			}
			recorder.stop();
		} else {
			setRecording(false);
			setRecordingReady(false);
		}
	}

	function cancelRecording() {
		const recorder = mediaRecorderRef.current;
		recordingIntentRef.current = 'discard';
		heldVoiceRef.current = null;
		chunksRef.current = [];
		if (recorder && recorder.state !== 'inactive') {
			recorder.stop();
		} else {
			cleanupRecordingMeters();
			setRecording(false);
			setRecordingReady(false);
		}
	}

	if (loading) {
		return (
			<div className="grid h-full min-h-0 place-items-center bg-[var(--color-surface-elevated)]">
				<LoaderCircle className="h-7 w-7 animate-spin text-(--shell-blue)" />
			</div>
		);
	}

	return (
		<div
			dir={isAr ? 'rtl' : 'ltr'}
			className="relative flex h-full min-h-0 w-full overflow-hidden pb-14 md:pb-0"
			style={{
				background: WA.shell,
				color: WA.text,
				fontFamily: WA.font,
				height: '100%',
				minHeight: 0,
			}}
		>
			{/* Floating Meta-style error/success toast */}
			{(flash || error || templatesError) && (
				<div className="pointer-events-none absolute inset-x-0 top-3 z-[70] flex justify-center px-4">
					<div className="pointer-events-auto w-fit max-w-full">
						<AlertBanner
							floating
							message={templatesError || flash || error}
							tone={
								templatesError || error || !isSuccessFlash(flash, t)
									? 'error'
									: 'success'
							}
							onClose={() => {
								setFlash(null);
								setError(null);
								setTemplatesError(null);
							}}
							t={t}
						/>
					</div>
				</div>
			)}

			{/* Mobile tab bar */}
			<nav className="absolute inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t border-[var(--shell-line)] bg-[color-mix(in_srgb,var(--color-surface-elevated)_95%,transparent)] px-2 py-2 backdrop-blur md:hidden">
				{[
					{ id: 'chats', label: t.chats, icon: <PubIcon src={PUB.chats} className="h-7 w-7 object-contain" /> },
					{ id: 'templates', label: t.templates, icon: <PubIcon src={PUB.templates} className="h-7 w-7 object-contain" /> },
					{ id: 'phones', label: t.phones, icon: <PubIcon src={PUB.phone} className="h-7 w-7 object-contain" /> },
					{ id: 'usage', label: t.usageBilling, icon: <PubIcon src={PUB.usageBilling} className="h-7 w-7 object-contain" /> },
				].map(item => (
					<button
						key={item.id}
						type="button"
						onClick={() => {
							setSidebarView(item.id);
							if (item.id === 'templates') setTemplatesMode('list');
						}}
						className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[12px] font-semibold transition-colors duration-200 ${
							sidebarView === item.id
								? 'bg-[var(--color-primary-soft)] text-[var(--shell-blue)]'
								: 'text-[var(--shell-muted)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--shell-blue)]'
						}`}
					>
						{item.icon}
						{item.label}
					</button>
				))}
				{isWhatsAppDemoToggleVisible() ? (
					<div className="ms-auto shrink-0">
						<WhatsAppDemoToggle variant="rail" onChanged={() => bootstrap()} />
					</div>
				) : null}
			</nav>
			<aside
				className="relative hidden w-[148px] shrink-0 flex-col items-center border-e border-[var(--shell-line)] bg-gradient-to-b from-[var(--color-surface-elevated)] to-[var(--color-surface-elevated)] px-1.5 pb-4 pt-3 md:flex"
			>
				<div className="mb-1 grid h-[120px] w-full place-items-center">
					<PubIcon src={PUB.whatsappLogo} alt="WhatsApp" className="h-[108px] w-[108px] object-contain" />
				</div>
				<nav className="flex w-full flex-1 flex-col gap-0.5 overflow-y-auto">
					<RailBtn active={sidebarView === 'chats'} onClick={() => setSidebarView('chats')} title={t.chats} badge={conversations.reduce((n, c) => n + (c.unreadCount || 0), 0) || false}>
						<PubIcon src={PUB.chats} className="h-[72px] w-[72px] object-contain" />
					</RailBtn>
					<RailBtn
						active={sidebarView === 'templates'}
						onClick={() => {
							setSidebarView('templates');
							setTemplatesMode('list');
						}}
						title={t.templates}
					>
						<PubIcon src={PUB.templates} className="h-[72px] w-[72px] object-contain" />
					</RailBtn>
					<RailBtn
						active={sidebarView === 'phones'}
						onClick={() => setSidebarView('phones')}
						title={t.phones}
						badge={!(status?.enabled && status?.connectionStatus === 'connected')}
					>
						<PubIcon src={PUB.phone} className="h-[72px] w-[72px] object-contain" />
					</RailBtn>
					<RailBtn active={sidebarView === 'usage'} onClick={() => setSidebarView('usage')} title={t.usageBilling}>
						<PubIcon src={PUB.usageBilling} className="h-[72px] w-[72px] object-contain" />
					</RailBtn>
				</nav>
				<div className="mt-auto flex w-full flex-col items-center gap-3">
					<WhatsAppDemoToggle variant="rail" onChanged={() => bootstrap()} />
					<WhatsAppAccountSwitcher onChanged={() => { void bootstrap(); void loadAccounts(); }} />
					<Link href="/" title="Dashboard" className="grid h-10 w-10 place-items-center rounded-xl text-[var(--shell-muted)] transition hover:bg-[var(--color-primary-soft)]">
						<ArrowLeft className={`h-5 w-5 ${isAr ? 'rotate-180' : ''}`} strokeWidth={1.8} />
					</Link>
				</div>
			</aside>

			{/* Chat list — hidden on other tabs */}
			{sidebarView === 'chats' ? (
			<section
				className={`${activeId ? 'hidden md:flex' : 'flex'} w-full shrink-0 flex-col md:w-[365px] md:min-w-[280px] md:max-w-[400px]`}
				style={{ background: WA.panel, borderInlineEnd: `1px solid ${WA.border}` }}
			>
						<header className="flex flex-col gap-3 px-7 pb-2 pt-8">
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-3">
									<PubIcon src={PUB.chats} className="h-11 w-11 object-contain" />
									<h1 className="text-[26px] font-bold tracking-tight text-[var(--shell-ink)]">{t.chats}</h1>
								</div>
								<div className="flex items-center gap-2">
									<ImportPhonesPopover
										t={t}
										busy={importBusy}
										onDownload={onDownloadPhoneTemplate}
										onFile={onUploadPhoneFile}
									>
										<Button type="button" size="icon" variant="outline" title={t.importPhones}>
											<img src={PUB.excel} alt="" className="h-5 w-5 object-contain" />
										</Button>
									</ImportPhonesPopover>
									<OpenByPhonePopover
										t={t}
										normalizePhone={normalizeWaPhone}
										busy={openingPhone}
										onOpen={onOpenPhone}
									>
										<Button type="button" size="icon" variant="outline" title={t.openPhone}>
											<Plus className="h-[23px] w-[23px]" strokeWidth={1.8} />
										</Button>
									</OpenByPhonePopover>
								</div>
							</div>
							<div className="control flex w-full items-center gap-3 text-[var(--shell-muted)]">
								<Search className="h-6 w-6 shrink-0" strokeWidth={1.7} />
								<input
									ref={searchInputRef}
									value={q}
									onChange={e => onSearchChange(e.target.value)}
									placeholder={t.search}
									className="w-full appearance-none border-0 bg-transparent text-[14px] shadow-none outline-none ring-0 placeholder:text-[var(--shell-muted)] focus:border-0 focus:shadow-none focus:outline-none focus:ring-0 focus-visible:border-0 focus-visible:shadow-none focus-visible:outline-none focus-visible:ring-0"
									style={{ color: WA.text, outline: 'none', boxShadow: 'none' }}
								/>
								<button
									type="button"
									onClick={() => {
										if (q) onSearchChange('');
										else searchInputRef.current?.focus();
									}}
									title={q ? t.search : t.search}
									className="grid h-8 w-8 place-items-center rounded-lg text-[var(--shell-muted)] hover:bg-[var(--color-surface-soft)]"
								>
									<Filter className="h-5 w-5 shrink-0" strokeWidth={1.7} />
								</button>
							</div>
							<ChatFilterBar
								isAr={isAr}
								value={filter}
								onChange={onFilterChange}
								items={[
									{ id: 'all', label: t.all, count: filterCounts.all },
									{ id: 'unread', label: t.unread, count: filterCounts.unread },
									{ id: 'leads', label: t.leads, count: filterCounts.leads },
									{ id: 'fav', label: t.fav, count: filterCounts.fav },
									{
										id: 'replied',
										label: t.replied,
										title: t.repliedTitle,
										count: filterCounts.replied,
									},
									{
										id: 'unreplied',
										label: t.unreplied,
										title: t.unrepliedTitle,
										count: filterCounts.unreplied,
									},
									{
										id: 'window24h',
										label: t.window24h,
										title: t.window24hTitle,
										count: filterCounts.window24h,
									},
								]}
							/>
						</header>

						<div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-[var(--color-primary-soft)]">
							<div className="relative min-h-0 flex-1 overflow-y-auto pt-1">
								{listLoading ? (
									<div className="grid min-h-40 place-items-center py-10">
										<LoaderCircle className="h-6 w-6 animate-spin text-[var(--shell-blue)]" />
									</div>
								) : !filtered.length ? (
									<EmptyHero
										icon={PUB.chats}
										title={t.noConversations}
										hint={
											filter === 'replied'
												? t.noRepliedHint
												: filter === 'unreplied'
													? t.noUnrepliedHint
													: filter === 'window24h'
														? t.noWindowHint
														: t.noConversationsHint
										}
									/>
								) : (
									filtered.map(c => {
										const selected = activeId === c.id;
										const name = c.displayName || c.businessName || c.waId;
										return (
											<button
												key={c.id}
												type="button"
												onClick={() => void selectConversation(c.id)}
												className={`relative flex w-full items-start gap-4 px-7 py-[19px] text-start ${selected ? 'ms-2.5 rounded-e-[17px] ps-[17px]' : ''}`}
												style={{ background: selected ? 'linear-gradient(90deg,var(--color-primary-soft),var(--color-primary-soft))' : 'transparent' }}
											>
												{selected ? <span className="absolute start-0 top-2 bottom-2 w-[3px] rounded bg-[var(--shell-blue)]" /> : null}
												<Avatar name={name} size={49} />
												<div className="min-w-0 flex-1 pt-0.5">
													<div className="truncate text-[16px] font-bold text-[var(--shell-ink)]">{name}</div>
													<p className="mt-2.5 truncate pe-8 text-[14px] text-[var(--shell-muted)]">
														{String(c.lastMessagePreview || '')
															.replace(/^\[template:(.*)\]$/, '$1')
															.replace(/^Template:\s*/i, '') || c.waId}
													</p>
												</div>
												<span className="absolute end-7 top-[19px] text-[13px]" style={{ color: selected || c.unreadCount ? 'var(--shell-blue)' : 'var(--shell-muted)' }}>
													{formatTime(c.lastMessageAt, locale)}
												</span>
												{c.isFavorite && !c.unreadCount ? (
													<Star className="absolute end-7 bottom-5 h-[19px] w-[19px] fill-[var(--color-warning)] text-[var(--color-warning)]" />
												) : null}
												{c.unreadCount > 0 ? (
													<span className="absolute end-7 bottom-5 grid h-[21px] w-[21px] place-items-center rounded-full bg-[var(--shell-blue)] text-[12px] font-bold text-white">
														{c.unreadCount}
													</span>
												) : null}
											</button>
										);
									})
								)}
							</div>
						</div>
			</section>
			) : null}

			<section
				className={`${activeId || sidebarView !== 'chats' ? 'flex' : 'hidden md:flex'} relative min-w-0 flex-1 flex-col overflow-hidden`}
				style={{
					minWidth: 0,
					...(sidebarView === 'chats' ? chatWallpaperStyle : { background: 'linear-gradient(180deg, rgba(255,255,255,.96), rgba(250,252,255,.94))' }),
				}}
			>
				{sidebarView === 'templates' ? (
					templatesMode === 'create' ? (
						<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
							<header className="relative flex flex-wrap items-start justify-between gap-3 border-b border-[var(--shell-line)] px-7 py-5">
								<div>
									<div className="flex items-center gap-2.5 text-[20px] font-bold text-[var(--shell-ink)]">
										<PubIcon src={PUB.templates} className="h-8 w-8 object-contain" />
										{editingTemplateId ? t.editTemplate : t.createTemplate}
									</div>
									<div className="mt-0.5 text-[12px] text-[var(--shell-muted)]">
										{editingTemplateId ? t.templateEditLocked : t.templateMetaDetails}
									</div>
								</div>
								<button
									type="button"
									onClick={() => {
										resetCreateTemplate();
										setTemplatesMode('list');
									}}
									className="inline-flex h-[45px] items-center gap-2.5 rounded-xl border border-[var(--shell-line)] bg-[var(--color-surface-elevated)] px-[18px] text-[12px] font-bold text-[var(--shell-ink)] shadow-[0_3px_8px_rgba(35,54,96,.06)]"
								>
									<ArrowLeft className={`h-4 w-4 text-[var(--shell-muted)] ${isAr ? 'rotate-180' : ''}`} />
									{t.backToTemplates}
								</button>
							</header>
							<div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-2">
								<form onSubmit={onCreateTemplate} className="min-h-0 space-y-3 overflow-y-auto border-b p-4 lg:border-b-0 lg:border-e" style={{ borderColor: WA.border }}>
									{createFormErrors.form ? (
										<div className="rounded-[12px] border border-[color-mix(in_srgb,var(--color-negative)_35%,var(--shell-line))] bg-[var(--color-negative-soft)] px-3 py-2.5 text-[12px] leading-5 text-[var(--color-negative)]">
											<div className="font-bold">{t.metaErrorTitle}</div>
											<p className="mt-1 whitespace-pre-wrap">{createFormErrors.form}</p>
											<p className="mt-1.5 text-[11px] opacity-80">{t.templateMetaErrorHint}</p>
										</div>
									) : null}
									<div className="rounded-[12px] border border-[var(--color-primary-soft)] bg-[color-mix(in_srgb,var(--color-primary-soft)_50%,var(--color-surface-elevated))] px-3 py-2.5">
										<div className="text-[12px] font-bold text-[var(--shell-ink)]">{t.templateAcceptTitle}</div>
										<ol className="mt-1.5 list-decimal space-y-1 ps-4 text-[11px] leading-relaxed text-[var(--shell-muted)]">
											{(t.templateAcceptSteps || []).map(step => (
												<li key={step}>{step}</li>
											))}
										</ol>
									</div>
									<label className="block space-y-1">
										<span className="text-[12px] font-medium" style={{ color: WA.muted }}>{t.templateName} *</span>
										<input
											value={createForm.name}
											disabled={Boolean(editingTemplateId)}
											onChange={e => {
												const name = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
												setCreateForm(f => ({ ...f, name }));
												setCreateFormErrors(err => ({ ...err, name: undefined, form: undefined }));
											}}
											placeholder="hello_world"
											className="w-full rounded-lg border px-3 py-2 text-sm outline-none disabled:opacity-60"
											style={{ borderColor: createFormErrors.name ? 'var(--color-negative)' : WA.border, background: WA.field }}
										/>
										{createFormErrors.name ? <p className="text-[11px] text-[var(--color-negative)]">{createFormErrors.name}</p> : null}
									</label>
									<div className="flex gap-2">
										<div className="block w-1/2 space-y-1">
											<span className="text-[12px] font-medium" style={{ color: WA.muted }}>{t.templateLang} *</span>
											<SelectField
												value={createForm.language}
												disabled={Boolean(editingTemplateId)}
												onValueChange={value => {
													setCreateForm(f => ({ ...f, language: value }));
													setCreateFormErrors(err => ({ ...err, language: undefined, form: undefined }));
												}}
												options={META_TEMPLATE_LANGUAGES}
												placeholder={t.templateLang}
												aria-label={t.templateLang}
												className="w-full min-w-0"
												contentClassName="z-[90]"
											/>
											{createFormErrors.language ? <p className="text-[11px] text-[var(--color-negative)]">{createFormErrors.language}</p> : null}
										</div>
										<div className="block w-1/2 space-y-1">
											<span className="text-[12px] font-medium" style={{ color: WA.muted }}>{t.templateCategory} *</span>
											<SelectField
												value={createForm.category}
												disabled={Boolean(editingTemplateId)}
												onValueChange={value => {
													setCreateForm(f => ({ ...f, category: value }));
													setCreateFormErrors(err => ({ ...err, category: undefined, form: undefined }));
												}}
												options={META_TEMPLATE_CATEGORIES}
												placeholder={t.templateCategory}
												aria-label={t.templateCategory}
												className="w-full min-w-0"
												contentClassName="z-[90]"
											/>
											{createFormErrors.category ? <p className="text-[11px] text-[var(--color-negative)]">{createFormErrors.category}</p> : null}
											{editingTemplateId ? (
												<p className="text-[11px]" style={{ color: WA.muted }}>{t.templateCategoryLocked}</p>
											) : null}
										</div>
									</div>

									<div className="space-y-2">
										<span className="text-[12px] font-medium" style={{ color: WA.muted }}>{t.templateHeaderType}</span>
										<div className="flex flex-wrap gap-[18px]">
											{[
												{ id: 'NONE', label: t.headerNone },
												{ id: 'TEXT', label: t.headerText },
												{ id: 'IMAGE', label: t.headerImage },
												{ id: 'VIDEO', label: t.headerVideo },
												{ id: 'DOCUMENT', label: t.headerDocument },
											].map(opt => (
												<button
													key={opt.id}
													type="button"
													onClick={() => {
														setCreateForm(f => ({ ...f, headerFormat: opt.id }));
														if (!['IMAGE', 'VIDEO', 'DOCUMENT'].includes(opt.id)) {
															setExistingHeaderComponent(null);
														}
														setCreateFormErrors(err => ({ ...err, headerSample: undefined, headerText: undefined }));
													}}
													className="inline-flex h-[42px] items-center justify-center rounded-[10px] px-5 text-[12px] font-bold"
													style={{
														border: createForm.headerFormat === opt.id ? '1.5px solid var(--shell-blue)' : '1px solid var(--shell-line)',
														background: createForm.headerFormat === opt.id ? 'var(--color-primary-soft)' : 'var(--color-surface-elevated)',
														color: createForm.headerFormat === opt.id ? 'var(--shell-blue)' : 'var(--shell-muted)',
														boxShadow: createForm.headerFormat === opt.id ? '0 0 0 4px rgba(70,108,236,.08)' : 'none',
													}}
												>
													{opt.label}
												</button>
											))}
										</div>
										{createForm.headerFormat === 'TEXT' ? (
											<label className="block space-y-1">
												<span className="text-[12px] font-medium" style={{ color: WA.muted }}>{t.templateHeader}</span>
												<input
													value={createForm.headerText}
													onChange={e => {
														setCreateForm(f => ({ ...f, headerText: e.target.value.slice(0, 60) }));
														setCreateFormErrors(err => ({ ...err, headerText: undefined }));
													}}
													maxLength={60}
													placeholder="Title {{1}}"
													className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
													style={{ borderColor: createFormErrors.headerText ? 'var(--color-negative)' : WA.border, background: WA.field }}
												/>
												{createFormErrors.headerText ? <p className="text-[11px] text-[var(--color-negative)]">{createFormErrors.headerText}</p> : null}
											</label>
										) : null}
										{['IMAGE', 'VIDEO', 'DOCUMENT'].includes(createForm.headerFormat) ? (
											<div className="space-y-1.5">
												<input
													ref={headerSampleRef}
													type="file"
													accept={
														createForm.headerFormat === 'IMAGE'
															? 'image/jpeg,image/png,image/jpg'
															: createForm.headerFormat === 'VIDEO'
																? 'video/mp4'
																: 'application/pdf'
													}
													className="hidden"
													onChange={e => onHeaderSamplePick(e.target.files?.[0])}
												/>
												<button
													type="button"
													onClick={() => headerSampleRef.current?.click()}
													className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-semibold"
													style={{ borderColor: createFormErrors.headerSample ? 'var(--color-negative)' : WA.border, color: WA.text, background: WA.field }}
												>
													{createForm.headerFormat === 'IMAGE' ? <ImageIcon className="h-4 w-4" /> : createForm.headerFormat === 'VIDEO' ? <Video className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
													{headerSampleFile ? t.changeSample : t.uploadSample}
												</button>
												{!headerSampleFile && existingHeaderComponent && editingTemplateId ? (
													<p className="text-[11px]" style={{ color: WA.muted }}>{t.keepExistingSample}</p>
												) : null}
												{headerSampleFile ? (
													<p className="truncate text-[11px]" style={{ color: WA.muted }}>{headerSampleFile.name}</p>
												) : (
													<p className="text-[11px]" style={{ color: WA.muted }}>{t.headerSampleHint}</p>
												)}
												{createFormErrors.headerSample ? <p className="text-[11px] text-[var(--color-negative)]">{createFormErrors.headerSample}</p> : null}
											</div>
										) : null}
									</div>

									<label className="block space-y-1">
										<div className="flex items-center justify-between gap-2">
											<span className="text-[12px] font-medium" style={{ color: WA.muted }}>{t.templateBody} *</span>
											<button type="button" onClick={insertBodyVar} className="text-[11px] font-semibold" style={{ color: WA.greenText }}>
												{t.insertVar}
											</button>
										</div>
										<textarea
											value={createForm.bodyText}
											onChange={e => {
												setCreateForm(f => ({ ...f, bodyText: e.target.value.slice(0, 1024) }));
												setCreateFormErrors(err => ({ ...err, bodyText: undefined }));
											}}
											placeholder={"Hello {{1}}, welcome to So7baFit."}
											rows={5}
											maxLength={1024}
											className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
											style={{ borderColor: createFormErrors.bodyText ? 'var(--color-negative)' : WA.border, background: WA.field }}
										/>
										{createFormErrors.bodyText ? (
											<p className="text-[11px] text-[var(--color-negative)]">{createFormErrors.bodyText}</p>
										) : (
											<p className="text-[11px]" style={{ color: WA.muted }}>{t.templateVarsMustBeNumbered}</p>
										)}
									</label>
									<label className="block space-y-1">
										<span className="text-[12px] font-medium" style={{ color: WA.muted }}>{t.templateFooter}</span>
										<input
											value={createForm.footerText}
											onChange={e => {
												setCreateForm(f => ({ ...f, footerText: e.target.value.slice(0, 60) }));
												setCreateFormErrors(err => ({ ...err, footerText: undefined }));
											}}
											maxLength={60}
											className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
											style={{ borderColor: createFormErrors.footerText ? 'var(--color-negative)' : WA.border, background: WA.field }}
										/>
									</label>

									<div className="space-y-2">
										<div className="flex items-center justify-between gap-2">
											<span className="text-[12px] font-medium" style={{ color: WA.muted }}>{t.templateButtons}</span>
											<div className="flex flex-wrap gap-1">
												<button type="button" onClick={() => addTemplateButton('QUICK_REPLY')} className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ color: WA.greenText }}>+ {t.buttonQuickReply}</button>
												<button type="button" onClick={() => addTemplateButton('URL')} className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ color: WA.greenText }}>+ {t.buttonUrlType}</button>
												<button type="button" onClick={() => addTemplateButton('PHONE_NUMBER')} className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ color: WA.greenText }}>+ {t.buttonPhoneType}</button>
											</div>
										</div>
										{createFormErrors.buttons ? <p className="text-[11px] text-[var(--color-negative)]">{createFormErrors.buttons}</p> : null}
										{(createForm.buttons || []).map((btn, idx) => (
											<div key={btn.id || idx} className="space-y-1.5 rounded-lg border p-2.5" style={{ borderColor: WA.border, background: WA.field }}>
												<div className="flex items-center gap-2">
													<SelectField
														value={btn.type}
														onValueChange={value => setCreateForm(f => ({
															...f,
															buttons: f.buttons.map((b, i) => i === idx ? { ...b, type: value } : b),
														}))}
														options={[
															{ value: 'QUICK_REPLY', label: t.buttonQuickReply },
															{ value: 'URL', label: t.buttonUrlType },
															{ value: 'PHONE_NUMBER', label: t.buttonPhoneType },
														]}
														aria-label={t.buttonType}
														className="h-[34px] min-h-[34px] w-[9.5rem] min-w-0"
														contentClassName="z-[90]"
													/>
													<input
														value={btn.text}
														onChange={e => setCreateForm(f => ({
															...f,
															buttons: f.buttons.map((b, i) => i === idx ? { ...b, text: e.target.value.slice(0, 25) } : b),
														}))}
														placeholder={t.buttonText}
														maxLength={25}
														className="min-w-0 flex-1 rounded-md border bg-[var(--color-surface-elevated)] px-2 py-1.5 text-[12px] outline-none"
														style={{ borderColor: createFormErrors[`button_${idx}_text`] ? 'var(--color-negative)' : WA.border }}
													/>
													<button
														type="button"
														onClick={() => setCreateForm(f => ({ ...f, buttons: f.buttons.filter((_, i) => i !== idx) }))}
														className="rounded-md p-1"
														style={{ color: WA.icon }}
													>
														<Trash2 className="h-4 w-4" />
													</button>
												</div>
												{btn.type === 'URL' ? (
													<input
														value={btn.url || ''}
														onChange={e => setCreateForm(f => ({
															...f,
															buttons: f.buttons.map((b, i) => i === idx ? { ...b, url: e.target.value } : b),
														}))}
														placeholder="https://example.com/{{1}}"
														className="w-full rounded-md border bg-[var(--color-surface-elevated)] px-2 py-1.5 text-[12px] outline-none"
														style={{ borderColor: createFormErrors[`button_${idx}_url`] ? 'var(--color-negative)' : WA.border }}
													/>
												) : null}
												{btn.type === 'PHONE_NUMBER' ? (
													<input
														value={btn.phone_number || ''}
														onChange={e => setCreateForm(f => ({
															...f,
															buttons: f.buttons.map((b, i) => i === idx ? { ...b, phone_number: e.target.value } : b),
														}))}
														placeholder="+97433112233"
														className="w-full rounded-md border bg-[var(--color-surface-elevated)] px-2 py-1.5 text-[12px] outline-none"
														style={{ borderColor: createFormErrors[`button_${idx}_phone`] ? 'var(--color-negative)' : WA.border }}
													/>
												) : null}
											</div>
										))}
									</div>

									<div className="rounded-lg px-3 py-2 text-[11px] leading-relaxed" style={{ background: WA.field, color: WA.muted }}>
										<div className="mb-1 font-semibold" style={{ color: WA.text }}>{t.templateMetaDetails}</div>
										<ul className="list-disc space-y-1 ps-4">
											<li>{t.templateNameInvalid}</li>
											<li>{t.templateVarsMustBeNumbered}</li>
											<li>{t.templateHeaderOneVar}</li>
											<li>{t.templateFooterNoVars}</li>
											<li>{t.buttonUrlHttps}</li>
											<li>{t.templatesHint}</li>
										</ul>
									</div>
									<Button
										type="submit"
										className="mt-5 w-full"
										size="lg"
										disabled={creatingTemplate}
										loading={creatingTemplate}
									>
										{editingTemplateId ? t.saveTemplate : t.createTemplate}
									</Button>
								</form>

								<TemplatePhonePreview
									t={t}
									createForm={createForm}
									headerSampleFile={headerSampleFile}
									headerSamplePreview={headerSamplePreview}
								/>
							</div>
						</div>
					) : (
						<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
							<header className="relative flex flex-wrap items-start justify-between gap-3 px-8 pb-4 pt-8">
								<div className="min-w-0">
									<div className="flex items-center gap-3">
										<PubIcon src={PUB.templates} className="h-11 w-11 object-contain" />
										<div className="text-[29px] font-bold leading-9 tracking-tight text-[var(--shell-ink)]">{t.templates}</div>
									</div>
									<div className="mt-1 text-[14px] text-[var(--shell-muted)]">
										<span className="text-[var(--shell-ink)]">{templates.length}</span>
										{' · '}
										{t.templatesCrumb}
										{' '}
										<button type="button" onClick={() => void loadMetaLibrary()} className="font-semibold text-[var(--shell-blue)]">
											| {t.learnMore}
										</button>
									</div>
								</div>
								<div className="flex flex-wrap items-center gap-2.5">
									<Button
										type="button"
										variant="outline"
										onClick={() => void loadMetaLibrary()}
										disabled={libraryLoading}
									>
										{libraryLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <BookOpen className="h-5 w-5" strokeWidth={1.7} />}
										{t.metaLibrary}
									</Button>
									<Button
										type="button"
										onClick={() => {
											resetCreateTemplate();
											setTemplatesMode('create');
										}}
									>
										<Plus className="h-5 w-5" strokeWidth={1.8} />
										{t.addNewTemplate}
									</Button>
								</div>
							</header>
							<div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-8 pb-6">
								{templatesLoading && !templates.length ? (
									<div className="grid min-h-[320px] place-items-center">
										<LoaderCircle className="h-7 w-7 animate-spin text-[var(--shell-blue)]" />
									</div>
								) : !templates.length ? (
									<EmptyHero icon={PUB.templates} title={t.templateEmptyTitle} hint={t.templateEmptyHint}>
										<Button
											type="button"
											className="mt-6"
											onClick={() => {
												resetCreateTemplate();
												setTemplatesMode('create');
											}}
										>
											<Plus className="h-5 w-5" strokeWidth={1.8} />
											{t.addNewTemplate}
										</Button>
									</EmptyHero>
								) : (
									<div className="overflow-hidden rounded-[20px] border border-[var(--shell-line)] bg-[color-mix(in_srgb,var(--color-surface-elevated)_95%,transparent)] p-4 shadow-[0_5px_18px_rgba(45,65,105,.055)]">
										<div className="mb-4 hidden grid-cols-[minmax(140px,1.3fr)_0.55fr_0.7fr_0.7fr_0.75fr_minmax(320px,2.2fr)] gap-2 rounded-[10px] bg-gradient-to-b from-[var(--color-surface-elevated)] to-[var(--color-surface-elevated)] px-4 py-3 text-[12px] font-bold uppercase tracking-wide text-[var(--shell-muted)] lg:grid">
											<div>{t.templateColName}</div>
											<div>{t.templateColLanguage}</div>
											<div>{t.templateColCategory}</div>
											<div>{t.templateColHeader}</div>
											<div>{t.templateColStatus}</div>
											<div>{t.templateColActions}</div>
										</div>
										<div className="flex flex-col gap-2">
											{templates.map(tpl => {
													const rowKey = `${tpl.id || tpl.name}::${tpl.language || ''}`;
													const hdrFmt = templateHeaderFormat(tpl.components);
													const btns = templateButtons(tpl.components);
													const status = String(tpl.status || '').toUpperCase();
													const approved = status === 'APPROVED';
													const deleting = deletingTemplateKey === rowKey;
													return (
														<div
															key={rowKey}
															className="grid items-center gap-3 rounded-xl border border-[var(--shell-line)] bg-[var(--color-surface-elevated)] px-4 py-4 shadow-[0_2px_6px_rgba(43,61,105,.025)] lg:grid-cols-[minmax(140px,1.3fr)_0.55fr_0.7fr_0.7fr_0.75fr_minmax(320px,2.2fr)]"
														>
															<div className="flex min-w-0 items-center gap-5">
																<div className={`grid h-[53px] w-[53px] shrink-0 place-items-center rounded-[11px] ${String(tpl.category).toUpperCase() === 'MARKETING' ? 'bg-gradient-to-br from-[var(--color-positive-soft)] to-[var(--color-positive-soft)]' : 'bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-primary-soft)]'}`}>
																	<PubIcon src={PUB.templates} className="h-6 w-6 object-contain" />
																</div>
																<div className="min-w-0">
																	<div className="truncate text-[14px] font-bold text-[var(--shell-ink)]" title={tpl.name}>{tpl.name}</div>
																	<div className="mt-1.5 text-[12px] text-[var(--shell-muted)]">
																		{tpl.id ? String(tpl.id).slice(-6) : btns.length ? `${btns.length} btn` : '—'}
																	</div>
																</div>
															</div>
															<div>
																<span className="inline-flex rounded-lg bg-[var(--color-primary-soft)] px-2.5 py-1.5 text-[12px] font-bold text-[var(--shell-blue)]">
																	{(tpl.language || '—').toUpperCase()}
																</span>
															</div>
															<div className="text-[12px] font-medium text-[var(--shell-muted)]">{tpl.category || '—'}</div>
															<div className="text-[12px] font-medium text-[var(--shell-muted)]">{hdrFmt || t.headerNone}</div>
															<div>
																<span className="inline-flex h-[31px] items-center gap-1.5 rounded-2xl px-3 text-[12px] font-bold" style={{
																	background: approved ? 'var(--color-positive-soft)' : status === 'REJECTED' ? 'var(--color-negative-soft)' : 'var(--color-warning-soft)',
																	color: approved ? 'var(--color-positive)' : status === 'REJECTED' ? 'var(--color-negative)' : 'var(--color-warning)',
																}}>
																	{approved ? <PubIcon src={PUB.check} className="h-4 w-4 object-contain" /> : null}
																	{tpl.status || '—'}
																</span>
															</div>
															<div className="flex flex-wrap items-center gap-2">
																	<Button
																		type="button"
																		variant="outline"
																		size="sm"
																		title={t.templateShow}
																		onClick={() => setPreviewTemplate(tpl)}
																	>
																		<Eye className="h-4 w-4" />
																		{t.templateShow}
																	</Button>
																	<Button
																		type="button"
																		size="sm"
																		title={t.templateUse}
																		disabled={!approved}
																		onClick={() => openVerifySend(tpl)}
																	>
																		<Send className="h-4 w-4" />
																		{t.templateUse}
																	</Button>
																	<Button
																		type="button"
																		variant="outline"
																		size="sm"
																		title={t.templateEdit}
																		disabled={!canEditMetaTemplate(tpl)}
																		onClick={() => openEditTemplate(tpl)}
																	>
																		<Pencil className="h-4 w-4" />
																		{t.templateEdit}
																	</Button>
																	<Button
																		type="button"
																		variant="outline"
																		size="sm"
																		title={t.templateCopyName}
																		aria-label={t.templateCopyName}
																		onClick={() => void copyTemplateName(tpl.name)}
																	>
																		<Copy className="h-4 w-4" />
																		{t.templateCopy}
																	</Button>
																	<Button
																		type="button"
																		variant="outline"
																		size="sm"
																		title={t.templateDelete}
																		aria-label={t.templateDelete}
																		disabled={deleting}
																		onClick={() => void onDeleteTemplate(tpl)}
																		className="text-[var(--color-negative)] hover:border-[color-mix(in_srgb,var(--color-negative)_35%,var(--shell-line))] hover:bg-[var(--color-negative-soft)] hover:text-[var(--color-negative)]"
																	>
																		{deleting ? (
																			<LoaderCircle className="h-4 w-4 animate-spin" />
																		) : (
																			<Trash2 className="h-4 w-4" />
																		)}
																		{t.templateDelete}
																	</Button>
															</div>
														</div>
													);
												})}
										</div>
										<div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1 text-[12px] text-[var(--shell-muted)]">
											<div>{isAr ? `عرض 1 إلى ${templates.length} من ${templates.length}` : `Showing 1 to ${templates.length} of ${templates.length} templates`}</div>
										</div>
									</div>
								)}
							</div>
						</div>
					)
				) : sidebarView === 'phones' ? (
					<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
						<header className="relative flex flex-wrap items-start justify-between gap-3 border-b border-[var(--shell-line)] px-7 pb-5 pt-7">
							<div>
								<h1 className="flex items-center gap-3 text-[23px] font-bold tracking-tight text-[var(--shell-ink)]">
									<PubIcon src={PUB.phone} className="h-10 w-10 object-contain" />
									{t.phones}
								</h1>
								<p className="mt-1.5 text-[13px] text-[var(--shell-muted)]">
									{accounts.length || 0} · Meta Cloud API · {t.connectedPhonesHint}{' '}
									<a href="https://developers.facebook.com/docs/whatsapp/cloud-api" target="_blank" rel="noreferrer" className="ms-1 font-semibold text-[var(--shell-blue)]">{t.learnMore}</a>
								</p>
							</div>
						</header>
						<div className="min-h-0 flex-1 overflow-hidden p-4">
							<div className="flex h-full min-h-0 overflow-hidden rounded-[23px] border border-[var(--shell-line)] bg-[color-mix(in_srgb,var(--color-surface-elevated)_80%,transparent)] shadow-[0_8px_30px_rgba(42,62,105,.04)]">
								<div className="flex w-full max-w-[483px] shrink-0 flex-col overflow-y-auto border-e border-[var(--shell-line)] px-6 py-7">
									<div className="mb-5 flex items-start justify-between gap-3">
										<div>
											<div className="flex items-center gap-2 text-[15px] font-bold text-[var(--shell-ink)]">
												<PubIcon src={PUB.phone} className="h-6 w-6 object-contain" />
												{t.connectedPhones}
											</div>
											<p className="mt-2 max-w-[285px] text-[12.5px] leading-[21px] text-[var(--shell-muted)]">{t.connectedPhonesHint}</p>
										</div>
										<AddWhatsAppNumberPopover
											title={t.phoneLabelTitle}
											addLabel={t.addPhone}
											cancelLabel={t.cancel}
											placeholder="WhatsApp"
											onCreated={async (created) => {
												if (created?.id) {
													setWhatsAppConfigId(created.id);
													await bootstrap();
													await loadAccounts();
												}
											}}
											onError={(err) => setFlash(apiErrorMessage(err))}
										>
											<Button type="button">
												<Plus className="h-4 w-4" />
												{t.addPhone}
											</Button>
										</AddWhatsAppNumberPopover>
									</div>
									<div className="flex flex-col gap-2.5">
										{(accounts.length ? accounts : status ? [status] : []).map(acc => {
											const active = (getWhatsAppConfigId() || status?.id) === acc.id;
											return (
												<button
													key={acc.id}
													type="button"
													onClick={() => {
														setWhatsAppConfigId(acc.id);
														void bootstrap();
													}}
													className={`relative rounded-[14px] border px-5 py-[18px] text-start ${active ? 'border-[var(--color-primary-soft)] bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-surface-elevated)] shadow-[0_5px_18px_rgba(48,86,183,.06)]' : 'border-[var(--shell-line)] bg-[color-mix(in_srgb,var(--color-surface-elevated)_75%,transparent)]'}`}
												>
													<div className="flex items-center gap-2.5">
														<PubIcon src={PUB.phone} className="h-5 w-5 shrink-0 object-contain" />
														{acc.enabled ? (
															<span className="inline-flex h-[22px] items-center rounded-[5px] border border-[var(--color-positive-soft)] bg-[var(--color-positive-soft)] px-2 text-[10px] font-bold text-[var(--color-positive)]">{t.activeBadge}</span>
														) : null}
														<span className="text-[15px] font-bold text-[var(--shell-ink)]">{acc.displayPhoneNumber || acc.label || acc.phoneNumberId}</span>
													</div>
													<div className="mt-2.5 text-[12px] text-[var(--shell-muted)]">{t.displayNameLabel}: <strong className="ms-1.5 font-semibold text-[var(--shell-muted)]">{acc.label || '—'}</strong></div>
													<div className="mt-1 text-[12px] text-[var(--shell-muted)]">WABA ID: <strong className="ms-1.5 font-semibold text-[var(--shell-muted)]">{acc.wabaId || '—'}</strong></div>
													<span className="mt-3 inline-flex items-center gap-1 rounded-[5px] border border-[var(--color-positive-soft)] bg-[var(--color-positive-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-positive)]">
														<PubIcon src={PUB.check} className="h-3 w-3 object-contain" />
														{t.verified}
													</span>
													<ChevronRight className={`absolute end-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--shell-blue)] ${isAr ? 'rotate-180' : ''}`} />
												</button>
											);
										})}
									</div>
									<div className="mt-8 flex gap-3 rounded-[13px] border border-[var(--color-primary-soft)] bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-primary-soft)] px-4 py-3.5 text-[11px] leading-[19px] text-[var(--shell-muted)]">
										<div className="grid h-[21px] w-[21px] shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)]">
											<Info className="h-3.5 w-3.5 text-[var(--shell-blue)]" />
										</div>
										<div>
											{t.phonesNote}
											{' '}
											<a href="https://developers.facebook.com/docs/whatsapp/cloud-api" target="_blank" rel="noreferrer" className="font-bold text-[var(--shell-blue)]">{t.learnMore}</a>
										</div>
									</div>
								</div>
								<div className="flex min-w-0 flex-1 flex-col overflow-y-auto px-5 py-6">
									<div className="relative mb-3 flex items-center rounded-[13px] border border-[var(--shell-line)] bg-gradient-to-r from-[var(--color-surface-elevated)] to-[var(--color-surface-elevated)] px-5 py-5">
										<div>
											<div className="mb-1.5 text-[11px] text-[var(--shell-muted)]">{t.activePhone}</div>
											<span className="text-[15px] font-bold text-[var(--shell-ink)]">{status?.displayPhoneNumber || status?.label || '—'}</span>
											{status?.enabled ? <span className="ms-2.5 inline-flex rounded-[5px] border border-[var(--color-positive-soft)] bg-[var(--color-positive-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-positive)]">{t.activeBadge}</span> : null}
										</div>
										<Button type="button" variant="outline" size="sm" className="absolute end-16 top-6" onClick={() => void onValidate()} disabled={validating}>
											{validating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
											{t.testConnection}
										</Button>
										<div className="absolute end-4 top-6">
											<button
												type="button"
												onClick={() => setPhoneMenuOpen(open => !open)}
												className="grid h-[39px] w-[38px] place-items-center rounded-[10px] border border-[var(--shell-line)] bg-[var(--color-surface-elevated)] text-[var(--shell-ink)]"
												title={t.templateColActions}
												aria-expanded={phoneMenuOpen}
											>
												<MoreHorizontal className="h-[18px] w-[18px]" />
											</button>
											{phoneMenuOpen ? (
												<div className="absolute end-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-[var(--shell-line)] bg-[var(--color-surface-elevated)] py-1 shadow-lg">
													<button
														type="button"
														className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12px] hover:bg-[var(--shell-line)]"
														onClick={() => void copyActivePhone()}
													>
														<Copy className="h-3.5 w-3.5" />
														{t.copyNumber}
													</button>
													<button
														type="button"
														className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12px] text-[var(--color-negative)] hover:bg-[var(--color-negative-soft)]"
														onClick={() => void onDeleteAccount()}
													>
														<Trash2 className="h-3.5 w-3.5" />
														{t.deletePhone}
													</button>
												</div>
											) : null}
										</div>
									</div>
									<div className="mb-2 flex gap-10 px-5">
										{[
											{ id: 'config', label: t.configuration },
											{ id: 'webhooks', label: t.webhooks },
											{ id: 'activity', label: t.activityLog },
										].map(tab => (
											<button
												key={tab.id}
												type="button"
												onClick={() => setPhonesPanel(tab.id)}
												className={`relative h-10 text-[12px] font-bold ${phonesPanel === tab.id ? 'text-[var(--shell-blue)]' : 'text-[var(--shell-muted)]'}`}
											>
												{tab.label}
												{phonesPanel === tab.id ? <span className="absolute inset-x-[-10px] bottom-0 h-[3px] rounded bg-[var(--shell-blue)]" /> : null}
											</button>
										))}
									</div>
									<div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[var(--shell-line)] bg-[color-mix(in_srgb,var(--color-surface-elevated)_70%,transparent)] p-6 shadow-[0_5px_16px_rgba(40,55,95,.025)]">
										{phonesPanel === 'activity' ? (
											activity.length ? (
												<ul className="divide-y divide-[var(--shell-line)]">
													{activity.map(row => (
														<li key={row.id} className="px-1 py-3">
															<div className="text-sm font-medium text-[var(--shell-ink)]">{row.action || row.event}</div>
															<pre className="mt-1 overflow-auto text-[11px] text-[var(--shell-muted)]">{JSON.stringify(row.details || row.payload || {}, null, 0)}</pre>
														</li>
													))}
												</ul>
											) : (
												<div className="grid min-h-[280px] place-items-center px-6 text-center">
													<div>
														<PubIcon src={PUB.empty} className="mx-auto mb-4 h-24 w-24 object-contain" />
														<p className="text-[16px] font-bold text-[var(--shell-ink)]">{t.activityEmptyTitle}</p>
														<p className="mt-2 text-[13px] text-[var(--shell-muted)]">{t.activityEmptyHint}</p>
													</div>
												</div>
											)
										) : phonesPanel === 'webhooks' ? (
											<div className="space-y-6">
												<ConfigField
													label={t.webhook}
													value={webhookUrl}
													t={t}
													readOnly
													mono
													hint={t.webhookHint}
												/>
												<ConfigField
													label={t.verifyToken}
													value={form.verifyToken || status?.verifyToken || ''}
													onChange={v => setForm(f => ({ ...f, verifyToken: v }))}
													t={t}
													mono
													required
													saved={Boolean(status?.hasVerifyToken || status?.verifyToken)}
													hint={t.verifyTokenHint}
													generateInside
													onGenerate={() => setForm(f => ({ ...f, verifyToken: randomVerifyToken() }))}
												/>
												<Button
													type="button"
													onClick={() => void onSave()}
													disabled={saving || !(form.verifyToken || status?.verifyToken)}
													loading={saving}
												>
													{t.save}
												</Button>
												<WhatsAppMetaSyncPanel
													t={t}
													report={syncReport}
													importResult={webhookImportResult}
													syncing={syncingMeta}
													importing={importingWebhooks}
													onSync={onSyncFromMeta}
													onImportFile={onImportWebhookFile}
												/>
											</div>
										) : (
											<form onSubmit={onSave} className="space-y-6">
												<ConfigSetupGuide t={t} />
												<div className="grid gap-7 md:grid-cols-2">
													<ConfigField label={t.webhook} value={webhookUrl} t={t} readOnly mono hint={t.webhookHint} />
													<ConfigField label={t.phoneNumberId} value={form.phoneNumberId} onChange={v => setForm(f => ({ ...f, phoneNumberId: v }))} t={t} mono required hint={t.phoneIdHint} />
													<ConfigField label={t.wabaId} value={form.wabaId} onChange={v => setForm(f => ({ ...f, wabaId: v }))} t={t} mono required hint={t.wabaHint} />
													<ConfigField label={t.verifyToken} value={form.verifyToken} onChange={v => setForm(f => ({ ...f, verifyToken: v }))} t={t} mono required saved={Boolean(status?.hasVerifyToken || status?.verifyToken)} hint={t.verifyTokenHint} generateInside onGenerate={() => setForm(f => ({ ...f, verifyToken: randomVerifyToken() }))} />
													<div className="md:col-span-2">
														<ConfigField
															label={t.accessToken}
															value={form.accessToken}
															onChange={v => setForm(f => ({ ...f, accessToken: v }))}
															t={t}
															type="password"
															required
															hint={t.accessTokenHint}
															saved={Boolean(status?.hasAccessToken)}
															placeholder={status?.hasAccessToken ? `${t.savedSecret} (${status.accessTokenHint})` : t.requiredMark}
														/>
													</div>
													<div className="md:col-span-2">
														<ConfigField
															label={t.appSecret}
															value={form.appSecret}
															onChange={v => setForm(f => ({ ...f, appSecret: v }))}
															t={t}
															type="password"
															required
															hint={t.appSecretHint}
															saved={Boolean(status?.hasAppSecret)}
															placeholder={status?.hasAppSecret ? `${t.savedSecret} (${status.appSecretHint})` : t.requiredMark}
														/>
													</div>
												</div>
												{status?.lastError && <p className="text-[12px] text-[var(--color-negative)]">{status.lastError}</p>}
												<div className="relative flex items-center rounded-[13px] border border-[var(--shell-line)] bg-[color-mix(in_srgb,var(--color-surface-elevated)_80%,transparent)] px-[18px] py-[17px]">
													<div className="grid h-5 w-5 place-items-center rounded-full border-2 border-[var(--color-positive)]">
														<Check className="h-3 w-3 text-[var(--color-positive)]" />
													</div>
													<div className="ms-3 min-w-0 flex-1">
														<div className="text-[10.5px] text-[var(--shell-muted)]">{isAr ? 'حالة الاتصال' : 'Connection status'}</div>
														<div className="mt-1 text-[12px] font-bold text-[var(--color-positive)]">{status?.enabled ? t.enabled : t.disabled} · {connectionLabel}</div>
														<div className="mt-1 text-[10px] text-[var(--shell-muted)]">{status?.displayPhoneNumber || ''}</div>
													</div>
													<Button type="button" variant="outline" size="sm" onClick={() => void onToggleEnabled()}>
														<Pause className="h-4 w-4" />
														{status?.enabled ? t.toggleOff : t.toggleOn}
													</Button>
												</div>
												<div className="flex flex-wrap gap-2">
													<Button type="submit" disabled={saving} loading={saving}>
														{t.save}
													</Button>
													<Button type="button" variant="outline" onClick={() => void onValidate()} disabled={validating} loading={validating}>
														{t.validate}
													</Button>
												</div>
												<WhatsAppMetaSyncPanel
													t={t}
													report={syncReport}
													importResult={webhookImportResult}
													syncing={syncingMeta}
													importing={importingWebhooks}
													onSync={onSyncFromMeta}
													onImportFile={onImportWebhookFile}
												/>
											</form>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				) : sidebarView === 'usage' ? (
					<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
						<header className="relative flex flex-wrap items-start justify-between gap-3 px-8 pb-4 pt-8">
							<div>
								<h1 className="flex items-center gap-3 text-[29px] font-bold tracking-tight text-[var(--shell-ink)]">
									<PubIcon src={PUB.usageBilling} className="h-11 w-11 object-contain" />
									{t.usageBillingTitle}
								</h1>
								<p className="mt-1 text-[14px] text-[var(--shell-muted)]">{t.usageBillingHint}</p>
							</div>
							<div className="flex flex-wrap items-center gap-2.5">
								<Button type="button" variant="outline" size="icon" disabled={usageLoading} onClick={() => void loadUsageBilling()} title={t.usageRefresh}>
									{usageLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
								</Button>
							</div>
						</header>
						<div className="min-h-0 flex-1 overflow-y-auto px-8 pb-8">
							{usageLoading && !usageData ? (
								<div className="grid min-h-[220px] place-items-center">
									<LoaderCircle className="h-6 w-6 animate-spin text-[var(--shell-blue)]" />
								</div>
							) : !usageData ? (
								<EmptyHero
									icon={PUB.usageBilling}
									title={usageError || t.usageEmpty}
									hint={t.usageInvoiceNote}
								>
									<Button type="button" className="mt-6" onClick={() => setSidebarView('phones')}>
										<Plus className="h-5 w-5" strokeWidth={1.8} />
										{t.usageEmptyCta}
									</Button>
								</EmptyHero>
							) : (() => {
								const s = usageData.summary || {};
								const fx = Number(usageData.fx?.usdToQar || usageData.fx?.usdToEgp || 3.64);
								const cats = Object.entries(s.byCategory || {});
								const maxCat = Math.max(1, ...cats.map(([, c]) => Number(c) || 0));
								const daily = usageData.daily || [];
								const maxSent = Math.max(1, ...daily.map(d => Number(d.sent) || 0));
								const vs = Number(s.vsPreviousMonthPct || 0);
								const rateCard = [...(usageData.rateCardSample || [])];
								const selectedRate = rateCard.find(r => r.market === usageMarket) || rateCard[0] || null;
								const rateRows = selectedRate
									? [
											{ key: 'marketing', label: t.usageRateMarketing, usd: selectedRate.marketing, color: 'var(--color-warning)', soft: 'var(--color-negative-soft)' },
											{ key: 'utility', label: t.usageRateUtility, usd: selectedRate.utility, color: 'var(--color-positive)', soft: 'var(--color-positive-soft)' },
											{ key: 'authentication', label: t.usageRateAuth, usd: selectedRate.authentication, color: 'var(--shell-blue)', soft: 'var(--color-primary-soft)' },
											{ key: 'service', label: t.usageRateService, usd: selectedRate.service, color: 'var(--color-positive)', soft: 'var(--color-positive-soft)' },
										]
									: [];
								return (
									<div className="space-y-5">
										<div className="flex items-center justify-between gap-3 rounded-[20px] bg-gradient-to-r from-[var(--shell-blue)] to-[var(--shell-blue)] px-6 py-5 text-white shadow-[0_8px_24px_rgba(44,89,255,.25)]">
											<div>
												<div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">{t.usageEstimated}</div>
												<div className="mt-1 text-[22px] font-bold tabular-nums">{formatMoneyUsd(s.estimatedCostUsd || 0)}</div>
												<div className="text-[13px] text-white/85">{formatMoneyEgp(s.estimatedCostEgp ?? Number(((s.estimatedCostUsd || 0) * fx).toFixed(2)))}</div>
											</div>
											<div className="text-end">
												<div className="text-[11px] text-white/70">{t.usageBillable}</div>
												<div className="text-[18px] font-bold tabular-nums">{s.billableDelivered ?? 0}</div>
												<div className="mt-1 text-[11px] font-semibold text-white/80">
													{vs >= 0 ? <span className="inline-block">+</span> : <span>-</span>} {Math.abs(vs).toFixed(0)}% {t.usageVsPrev}
												</div>
											</div>
										</div>
										<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
											{[
												{ label: t.usageSent, value: s.sent, icon: PUB.broadcast || PUB.chart },
												{ label: t.usageDelivered, value: s.delivered, icon: PUB.check },
												{ label: t.usageRead, value: s.read, icon: PUB.trusted },
												{ label: t.usageFailed, value: s.failed, icon: PUB.warning },
											].map(card => (
												<div key={card.label} className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--shell-line)] bg-[var(--color-surface-elevated)] px-4 py-4 shadow-[0_2px_6px_rgba(43,61,105,.025)]">
													<div className="flex items-center gap-3">
														<PubIcon src={card.icon} className="h-8 w-8 object-contain" />
														<span className="text-[13px] font-semibold text-[var(--shell-muted)]">{card.label}</span>
													</div>
													<span className="text-[18px] font-bold tabular-nums text-[var(--shell-ink)]">{card.value ?? 0}</span>
												</div>
											))}
										</div>
										<section className="rounded-[20px] border border-[var(--shell-line)] bg-[var(--color-surface-elevated)] p-5 shadow-[0_5px_18px_rgba(45,65,105,.055)]">
											<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
												<div>
													<div className="text-[15px] font-bold text-[var(--shell-ink)]">{t.usageCountryRates}</div>
													<div className="text-[12px] text-[var(--shell-muted)]">{t.usagePerMessage}</div>
												</div>
												<label className="flex items-center gap-2 text-[12px] font-semibold text-[var(--shell-muted)]">
													{t.usageSelectCountry}
													<select value={usageMarket} onChange={e => setUsageMarket(e.target.value)} className="h-[34px] rounded-[11px] border border-[var(--shell-line)] bg-[var(--color-surface-elevated)] px-2 text-[12px] font-semibold text-[var(--shell-ink)] outline-none">
														{rateCard.map(r => (
															<option key={r.market} value={r.market}>{r.label}</option>
														))}
													</select>
												</label>
											</div>
											<div className="grid gap-2 sm:grid-cols-2">
												{rateRows.map(row => (
													<div key={row.key} className="rounded-xl px-3 py-2.5" style={{ background: row.soft }}>
														<div className="flex items-center justify-between">
															<span className="text-[12px] font-bold" style={{ color: row.color }}>{row.label}</span>
															<span className="text-[13px] font-bold tabular-nums text-[var(--shell-ink)]">{formatRateUsd(row.usd)}</span>
														</div>
													</div>
												))}
											</div>
										</section>
										<div className="grid gap-4 lg:grid-cols-2">
											<section className="rounded-[20px] border border-[var(--shell-line)] bg-[var(--color-surface-elevated)] p-5 shadow-[0_5px_18px_rgba(45,65,105,.055)]">
												<h4 className="text-[15px] font-bold text-[var(--shell-ink)]">{t.usageByCategory}</h4>
												<p className="mb-3 text-[12px] text-[var(--shell-muted)]">{t.usageByCategoryHint}</p>
												<div className="space-y-3">
													{cats.length ? cats.map(([cat, count]) => {
														const style = USAGE_CAT_STYLE[cat] || USAGE_CAT_STYLE.UNKNOWN;
														const costUsd = Number(usageData.byCategoryCost?.[cat] || 0);
														const costEgp = Number(usageData.byCategoryCostEgp?.[cat]) || Number((costUsd * fx).toFixed(2));
														const pct = Math.round((Number(count) / maxCat) * 100);
														return (
															<div key={cat}>
																<div className="flex items-center justify-between gap-2">
																	<span className="rounded px-1.5 py-0.5 text-[11px] font-bold" style={{ background: style.bg, color: style.text }}>{cat}</span>
																	<div className="flex items-center gap-3">
																		<span className="text-[13px] font-bold tabular-nums">{count}</span>
																		<MoneyDuo size="inline" usd={costUsd} egp={costEgp} />
																	</div>
																</div>
																<div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/5">
																	<div className="h-full rounded-full" style={{ width: `${pct}%`, background: style.bar }} />
																</div>
															</div>
														);
													}) : <p className="text-[12px] text-[var(--shell-muted)]">—</p>}
												</div>
											</section>
											<section className="rounded-[20px] border border-[var(--shell-line)] bg-[var(--color-surface-elevated)] p-5 shadow-[0_5px_18px_rgba(45,65,105,.055)]">
												<h4 className="mb-3 text-[15px] font-bold text-[var(--shell-ink)]">{t.usageByCountry}</h4>
												<div className="max-h-48 space-y-1.5 overflow-y-auto">
													{(usageData.byCountry || []).length ? (usageData.byCountry || []).map(row => (
														<div key={row.country} className="flex items-center justify-between gap-2 rounded-xl bg-[var(--color-primary-soft)] px-3 py-2">
															<div className="min-w-0">
																<div className="truncate text-[13px] font-semibold text-[var(--shell-ink)]">{row.label || row.country}</div>
																<div className="text-[11px] text-[var(--shell-muted)]">{row.count}</div>
															</div>
															<MoneyDuo size="inline" usd={row.estimatedCostUsd} egp={row.estimatedCostEgp ?? Number((Number(row.estimatedCostUsd || 0) * fx).toFixed(2))} />
														</div>
													)) : <p className="text-[12px] text-[var(--shell-muted)]">—</p>}
												</div>
											</section>
										</div>
										<section className="rounded-[20px] border border-[var(--shell-line)] bg-[var(--color-surface-elevated)] p-5 shadow-[0_5px_18px_rgba(45,65,105,.055)]">
											<h4 className="mb-3 text-[15px] font-bold text-[var(--shell-ink)]">{t.usageDaily}</h4>
											{!daily.length ? (
												<p className="text-[12px] text-[var(--shell-muted)]">{t.usageEmpty}</p>
											) : (
												<div className="flex h-24 items-end gap-1 overflow-x-auto">
													{daily.map(day => {
														const h = Math.max(4, Math.round((Number(day.sent) / maxSent) * 72));
														return (
															<div key={day.date} className="flex w-6 shrink-0 flex-col items-center gap-1" title={day.date}>
																<div className="w-full rounded-t bg-[var(--shell-blue)]" style={{ height: h }} />
																<span className="text-[9px] tabular-nums text-[var(--shell-muted)]">{String(day.date).slice(8)}</span>
															</div>
														);
													})}
												</div>
											)}
										</section>
									</div>
								);
							})()}
						</div>
					</div>
				) : !activeId || !active ? (
					<div className="grid flex-1 place-items-center px-6 text-center" style={{ background: WA.panel }}>
						<div>
							<PubIcon src={PUB.chats} className="mx-auto mb-5 h-[180px] w-[180px] max-h-[36vh] max-w-full object-contain" />
							<p className="text-[17px] font-bold" style={{ color: WA.text }}>{t.emptyChat}</p>
							<p className="mt-2 text-[13px]" style={{ color: WA.muted }}>{status?.enabled ? connectionLabel : t.disabled}{status?.displayPhoneNumber ? ` · ${status.displayPhoneNumber}` : ''}</p>
						</div>
					</div>
				) : (
					<>
						<header className="relative z-10 flex items-center gap-4 border-b border-[var(--shell-line)] bg-[color-mix(in_srgb,var(--color-surface-elevated)_97%,transparent)] px-7 py-5">
							<div className="flex min-w-0 flex-1 items-center gap-4">
								<button
									type="button"
									className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-[var(--color-surface-soft)] md:hidden"
									style={{ color: WA.icon }}
									onClick={closeActiveChat}
									title={t.backToChats}
									aria-label={t.backToChats}
								>
									<ChevronLeft
										className={`h-6 w-6 ${isAr ? 'rotate-180' : ''}`}
										strokeWidth={2.25}
									/>
								</button>
								<Avatar name={active.displayName || active.businessName || active.waId} size={50} />
								<div className="min-w-0">
									<div className="truncate text-[17px] font-bold text-[var(--shell-ink)]">{active.displayName || active.businessName || active.waId}</div>
									<div className="mt-1 truncate text-[14px] text-[var(--shell-muted)]">{active.waId}</div>
								</div>
							</div>
							<div className="flex flex-wrap items-center gap-2.5">
								<span className={`hidden h-11 items-center gap-2 rounded-[18px] px-4 text-[13px] sm:inline-flex ${canSendFreeform ? 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]' : 'bg-[var(--color-primary-soft)] text-[var(--shell-muted)]'}`}>
									<Clock className="h-[18px] w-[18px]" strokeWidth={1.7} />
									{canSendFreeform ? t.windowOpen : t.windowClosed}
								</span>
								<button
									type="button"
									onClick={() => void toggleFavorite(active)}
									className="grid h-7 w-7 place-items-center"
									style={{ color: active.isFavorite ? 'var(--color-warning)' : 'var(--shell-muted)' }}
									title={active.isFavorite ? t.removeFavorite : t.addFavorite}
									aria-label={active.isFavorite ? t.removeFavorite : t.addFavorite}
									aria-pressed={Boolean(active.isFavorite)}
								>
									<Star
										className={`h-7 w-7 ${active.isFavorite ? 'fill-current' : ''}`}
										strokeWidth={1.6}
									/>
								</button>
								<button
									type="button"
									onClick={closeActiveChat}
									className="grid h-8 w-8 place-items-center rounded-lg text-[var(--shell-muted)] hover:bg-[var(--color-surface-elevated)]"
									title={t.closeChat}
									aria-label={t.closeChat}
								>
									<X className="h-5 w-5" />
								</button>
							</div>
						</header>

						<div
							ref={messagesScrollRef}
							className="relative z-0 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3"
							style={chatWallpaperStyle}
						>
							<div className="mx-auto z-[2] flex min-h-[50px] min-w-[280px] items-center justify-center gap-2.5 rounded-2xl border border-[var(--color-primary-soft)] bg-[color-mix(in_srgb,var(--color-surface-elevated)_94%,transparent)] px-5 text-[14px] text-[var(--shell-muted)] shadow-[0_5px_18px_rgba(46,62,104,.08)]">
								<Lock className="h-[18px] w-[18px]" />
								{t.encryption}
							</div>
							<div className="relative mx-auto mt-3 max-w-[496px] rounded-[15px] bg-gradient-to-r from-[var(--color-primary-soft)] to-[var(--color-primary-soft)] py-3 ps-12 pe-6 text-[14px] leading-6 text-[var(--shell-blue)] shadow-[0_5px_15px_rgba(50,83,190,.03)]">
								<Info className="absolute start-[19px] top-4 h-4 w-4" />
								{t.metaNote}
							</div>
							{buildChatRows(messages).map(row => {
								if (row.kind === 'image_grid') {
									const mine = row.direction === 'outbound';
									return (
										<div key={row.key} className={`flex px-1 ${mine ? 'justify-end' : 'justify-start'}`}>
											<ImageGridBubble
												messages={row.messages}
												mine={mine}
												locale={locale}
												onOpenMedia={(url, kind) => setMediaLightbox({ url, kind })}
											/>
										</div>
									);
								}

								const m = row.message;
								const mine = m.direction === 'outbound';
								const type = String(m.messageType || '').toLowerCase();
								const isSticker = type === 'sticker';
								const isTemplate = type === 'template';
								const isButtonReply =
									type === 'button' ||
									type === 'interactive' ||
									/^\[button\]/i.test(String(m.body || ''));
								const caption = messageCaption(m);
								const showUnsupported =
									type === 'unsupported' ||
									/^\[unsupported\]$/i.test(String(m.body || '').trim());
								const templateParts = isTemplate
									? resolveTemplateMessageParts(m, templates)
									: null;
								const translateText = getMessageTranslateText(m, templates);
								const canTranslate = false;
								const translation = messageTranslations[m.id];
								const translateTarget = detectTranslateTarget(translateText);
								const translateTitle =
									translation?.open && translation?.text
										? t.translateHide
										: translateTarget === 'en'
											? t.translateToEn
											: t.translateToAr;

								const translateBtn = canTranslate ? (
									<button
										type="button"
										onClick={() => toggleMessageTranslation(m)}
										disabled={translation?.loading}
										title={translateTitle}
										aria-label={translateTitle}
										className="mb-1 grid h-7 w-7 shrink-0 place-items-center rounded-full transition hover:bg-[var(--color-surface-soft)] disabled:opacity-50"
										style={{ color: WA.icon }}
									>
										{translation?.loading ? (
											<LoaderCircle className="h-3.5 w-3.5 animate-spin" />
										) : (
											<Languages className="h-3.5 w-3.5" strokeWidth={2} />
										)}
									</button>
								) : null;

								return (
									<div key={m.id} className={`flex flex-col gap-1 px-1 ${mine ? 'items-end' : 'items-start'}`}>
										<div className={`flex max-w-full items-end gap-1 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
											<div
												className={`relative max-w-[360px] text-[13px] font-medium leading-[1.35] ${
													isSticker
														? 'bg-transparent p-0 shadow-none'
														: 'min-w-[84px] overflow-hidden shadow-[0_1px_0_rgba(0,0,0,0.08)]'
												}`}
												style={{
													background: isSticker
														? 'transparent'
														: mine
															? WA.bubbleOut
															: WA.bubbleIn,
													color: WA.text,
													borderRadius: 17,
													border: mine ? 'none' : '1px solid var(--shell-line)',
													boxShadow: '0 5px 14px rgba(47,62,104,.05)',
													fontSize: 15,
													lineHeight: '25px',
												}}
											>
												<div className={isSticker ? '' : 'px-2.5 pb-1.5 pt-1.5'}>
													{m.hasMedia ? (
														<MediaBubble
															message={m}
															mine={mine}
															labels={t}
															onOpenMedia={(url, kind) => setMediaLightbox({ url, kind })}
														/>
													) : null}
													{type === 'sticker' && !m.hasMedia ? (
														<div
															className="rounded-xl px-3 py-2 text-[12px]"
															style={{ background: WA.bubbleIn, color: WA.muted }}
														>
															{t.stickerUnavailable}
														</div>
													) : null}
													{showUnsupported ? (
														<div className="text-[12px]" style={{ color: WA.muted }}>
															{t.unsupportedMessage}
														</div>
													) : null}
													{isTemplate ? (
														<div className="space-y-1">
															{m.templateName ? (
																<div
																	className="text-[11px] font-semibold"
																	style={{ color: WA.muted }}
																>
																	{m.templateName}
																</div>
															) : null}
															{templateParts?.header ? (
																<div className="whitespace-pre-wrap break-words font-bold">
																	<RichMessageText
																		text={templateParts.header}
																		onPhoneClick={openChatFromPhoneNumber}
																	/>
																</div>
															) : null}
															{templateParts?.body ? (
																<div className="whitespace-pre-wrap break-words">
																	<RichMessageText
																		text={templateParts.body}
																		onPhoneClick={openChatFromPhoneNumber}
																	/>
																</div>
															) : null}
															{templateParts?.footer ? (
																<div
																	className="whitespace-pre-wrap break-words text-[11px]"
																	style={{ color: WA.muted }}
																>
																	<RichMessageText
																		text={templateParts.footer}
																		onPhoneClick={openChatFromPhoneNumber}
																	/>
																</div>
															) : null}
														</div>
													) : null}
													{isButtonReply && !isTemplate && !showUnsupported ? (
														<div
															className="mb-1 inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
															style={{ background: 'rgba(2,126,181,0.10)', color: 'var(--shell-blue)' }}
														>
															<MessageCircle className="h-3.5 w-3.5 shrink-0" />
															<span className="truncate">
																{caption || m.body || (isAr ? 'رد زر' : 'Button reply')}
															</span>
														</div>
													) : null}
													{caption &&
													!isTemplate &&
													!isButtonReply &&
													!showUnsupported ? (
														<div
															className={`whitespace-pre-wrap break-words ${m.hasMedia ? 'mt-1' : ''}`}
														>
															<RichMessageText
																text={caption}
																onPhoneClick={openChatFromPhoneNumber}
															/>
														</div>
													) : null}
													{type === 'text' &&
													!caption &&
													m.body &&
													!isMediaPlaceholderBody(m.body) ? (
														<div className="whitespace-pre-wrap break-words">
															<RichMessageText
																text={m.body}
																onPhoneClick={openChatFromPhoneNumber}
															/>
														</div>
													) : null}
													<div
														className={`mt-1 flex items-center justify-end gap-1 text-[11px] font-medium ${
															isSticker
																? 'rounded-full bg-black/25 px-2 py-0.5 text-white'
																: ''
														}`}
														style={isSticker ? undefined : { color: 'rgba(0,0,0,0.50)' }}
													>
														<span>
															{formatTime(m.createdAt || m.providerTimestamp, locale)}
														</span>
														{mine && <StatusTicks status={m.status} />}
													</div>
													{m.errorMessage ? (
														<div className="mt-1 text-[11px] text-[var(--color-negative)]">
															{m.errorMessage}
														</div>
													) : null}
												</div>
												{isTemplate ? (
													<TemplateActionButtons buttons={templateParts?.buttons} />
												) : null}
											</div>
											{translateBtn}
										</div>
										{translation?.open ? (
											<div
												className="max-w-[360px] rounded-xl px-2.5 py-1.5 text-[12px] leading-[1.35] shadow-[0_1px_0_rgba(0,0,0,0.06)]"
												style={{
													background: 'rgba(255,255,255,0.92)',
													color: WA.text,
													border: `1px solid ${WA.border}`,
												}}
												dir={translation?.targetLang === 'ar' ? 'rtl' : 'ltr'}
											>
												<div
													className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide"
													style={{ color: WA.muted }}
												>
													{t.translatedLabel}
													{translation?.sourceLang && translation?.targetLang
														? ` · ${String(translation.sourceLang).toUpperCase()} → ${String(translation.targetLang).toUpperCase()}`
														: ''}
												</div>
												{translation.loading ? (
													<div className="flex items-center gap-1.5" style={{ color: WA.muted }}>
														<LoaderCircle className="h-3.5 w-3.5 animate-spin" />
														<span>…</span>
													</div>
												) : translation.error ? (
													<div className="text-[var(--color-negative)]">{translation.error}</div>
												) : (
													<div className="whitespace-pre-wrap break-words">
														{translation.text}
													</div>
												)}
											</div>
										) : null}
									</div>
								);
							})}
							<div ref={bottomRef} />
						</div>

						<footer className="z-10 bg-[var(--color-surface-elevated)] px-7 py-5">
							{canSendFreeform ? (
								recording ? (
									<div className="flex w-full items-center gap-2">
										<button
											type="button"
											onClick={cancelRecording}
											className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[var(--color-negative)] transition hover:scale-105 hover:bg-[var(--color-negative-soft)] active:scale-95"
											title={t.recordingCancel}
										>
											<Trash2 className="h-5 w-5" strokeWidth={2} />
										</button>
										<div className="relative flex min-h-[64px] flex-1 items-center gap-3 overflow-hidden rounded-[28px] border border-[color-mix(in_srgb,var(--color-negative)_28%,var(--shell-line))] bg-[var(--color-surface-elevated)] px-4 py-2 shadow-[0_8px_20px_color-mix(in_srgb,var(--color-negative)_10%,transparent)]">
											<span className="relative flex h-3 w-3 shrink-0">
												{recordingPaused || recordingReady ? (
													<span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--color-negative)] opacity-50" />
												) : (
													<>
														<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-negative)] opacity-75" />
														<span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--color-negative)]" />
													</>
												)}
											</span>
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<span className="text-[13px] font-bold tracking-wide text-[var(--color-negative)]">
														{recordingReady ? t.recordingReady : recordingPaused ? t.recordingPause : t.recording}
													</span>
													<span className="rounded-full bg-[color-mix(in_srgb,var(--color-negative)_12%,transparent)] px-2 py-0.5 font-mono text-[12px] font-semibold tabular-nums text-[var(--color-negative)]">
														{formatAudioClock(recordingSeconds)}
													</span>
												</div>
												<div className="mt-1.5 flex h-6 items-end gap-[2px]">
													{Array.from({ length: 32 }).map((_, i) => {
														const wave = recordingReady || recordingPaused
															? 0.22 + ((i * 17) % 10) / 28
															: 0.25 + Math.abs(Math.sin(i * 0.55 + recordingSeconds * 4)) * recordingLevel * 0.9;
														return (
															<span
																key={i}
																className="w-[3px] rounded-full transition-[height] duration-75"
																style={{
																	height: `${Math.max(3, Math.round(wave * 20))}px`,
																	background: i % 3 === 0 ? 'var(--color-negative)' : 'color-mix(in srgb, var(--color-negative) 45%, var(--shell-mix-base))',
																}}
															/>
														);
													})}
												</div>
												<p className="mt-0.5 truncate text-[10px] text-[var(--shell-muted)]">
													{recordingReady ? t.recordingReadyHint : t.recordingHint}
												</p>
											</div>
											<div className="flex shrink-0 items-center gap-1.5">
												{recordingReady ? null : (
													<button
														type="button"
														onClick={() => (recordingPaused ? resumeRecording() : pauseRecording())}
														className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-negative-soft)] text-[var(--color-negative)] transition hover:scale-105 active:scale-95"
														title={recordingPaused ? t.recordingResume : t.recordingPause}
													>
														{recordingPaused ? <Play className="h-4 w-4" strokeWidth={2.2} /> : <Pause className="h-4 w-4" strokeWidth={2.2} />}
													</button>
												)}
												{recordingReady ? null : (
													<button
														type="button"
														onClick={stopRecordingHold}
														className="grid h-9 w-9 place-items-center rounded-full bg-[var(--shell-ink)] text-white transition hover:scale-105 active:scale-95"
														title={t.recordingStop}
													>
														<Square className="h-3.5 w-3.5 fill-current" strokeWidth={2} />
													</button>
												)}
											</div>
										</div>
										<button
											type="button"
											onClick={stopRecording}
											className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-white shadow-lg transition hover:scale-105 active:scale-95"
											style={{ background: WA.green }}
											title={t.recordingSend}
										>
											<Send className="h-5 w-5" strokeWidth={2.25} />
										</button>
									</div>
								) : (
									<form onSubmit={onSendText} className="flex h-[92px] w-full items-center gap-5 rounded-[22px] border border-[var(--shell-line)] bg-[var(--color-surface-elevated)] px-6 shadow-[0_8px_25px_rgba(29,51,94,.08)]">
										<input ref={imageRef} type="file" accept="image/*" multiple className="hidden" onChange={e => {
											const files = [...(e.target.files || [])];
											e.target.value = '';
											files.forEach(f => void uploadFile(f));
										}} />
										<input ref={fileRef} type="file" accept="image/*,audio/*,video/*,.pdf,.doc,.docx" className="hidden" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void uploadFile(f); }} />
										<div className="flex items-center gap-2 text-[var(--shell-muted)]">
											<ComposeIconBtn title="Attach" disabled={sending} onClick={() => fileRef.current?.click()}>
												<Paperclip className="h-6 w-6" strokeWidth={1.75} />
											</ComposeIconBtn>
											<ComposeIconBtn title="Image" disabled={sending} onClick={() => imageRef.current?.click()}>
												<ImageIcon className="h-6 w-6" strokeWidth={1.75} />
											</ComposeIconBtn>
											<ComposeIconBtn title={t.sendTemplate} disabled={sending} onClick={openSendTemplate}>
												<LayoutTemplate className="h-6 w-6" strokeWidth={1.75} />
											</ComposeIconBtn>
											<ComposeIconBtn title={t.fastReplies} disabled={sending || openingChatPhone} onClick={() => void openQuickReplies()}>
												<Zap className="h-6 w-6" strokeWidth={1.75} />
											</ComposeIconBtn>
										</div>
										<div className="relative flex h-[58px] min-w-0 flex-1 items-center rounded-[30px] bg-gradient-to-r from-[var(--color-surface-elevated)] to-[var(--color-surface-elevated)] px-6">
											<input
												value={draft}
												onChange={e => setDraft(e.target.value)}
												placeholder={t.typeMessage}
												className="w-full bg-transparent text-[16px] outline-none placeholder:text-[var(--shell-muted)]"
												style={{ color: WA.text }}
											/>
										</div>
										{draft.trim() ? (
											<Button
												type="submit"
												size="icon"
												disabled={sending}
												title={t.typeMessage}
											>
												<Send className="h-5 w-5" strokeWidth={2.2} />
											</Button>
										) : (
											<Button
												type="button"
												size="icon"
												disabled={sending}
												onClick={() => void startRecording()}
												title="Voice"
											>
												<Mic className="h-6 w-6" strokeWidth={1.7} />
											</Button>
										)}
									</form>
								)
							) : (
								<div className="flex w-full flex-wrap items-center gap-2">
									<p className="flex-1 text-[12px]" style={{ color: WA.muted }}>{t.windowClosed}</p>
									<Button type="button" onClick={openSendTemplate} disabled={sending}>
										{t.sendTemplate}
									</Button>
								</div>
							)}
						</footer>
					</>
				)}
			</section>

			{libraryOpen && (
				<div
					className="absolute inset-0 z-50 grid place-items-center bg-[color-mix(in_srgb,var(--shell-ink)_45%,transparent)] p-3 sm:p-6"
					onClick={() => setLibraryOpen(false)}
				>
					<div
						className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(11,20,26,0.28)]"
						style={{ background: WA.panel }}
						onClick={e => e.stopPropagation()}
					>
						<header
							className="flex items-start justify-between gap-3 border-b px-5 py-4"
							style={{ borderColor: WA.border, background: 'var(--color-surface-elevated)' }}
						>
							<div className="min-w-0">
								<div className="flex items-center gap-2">
									<span
										className="grid h-9 w-9 place-items-center rounded-xl"
										style={{ background: WA.greenSoft, color: WA.greenText }}
									>
										<BookOpen className="h-4 w-4" />
									</span>
									<div>
										<h3 className="text-[17px] font-bold" style={{ color: WA.text }}>{t.metaLibrary}</h3>
										<p className="text-[12px]" style={{ color: WA.muted }}>{t.metaLibraryHint}</p>
									</div>
								</div>
							</div>
							<button
								type="button"
								onClick={() => setLibraryOpen(false)}
								className="rounded-lg p-1.5 hover:bg-[var(--color-surface-soft)]"
								style={{ color: WA.icon }}
							>
								<X className="h-5 w-5" />
							</button>
						</header>

						<div className="flex items-center gap-2 border-b px-5 py-3" style={{ borderColor: WA.border }}>
							<div
								className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5"
								style={{ background: WA.field, outline: `1px solid ${WA.searchBorder}`, outlineOffset: -1 }}
							>
								<Search className="h-4 w-4 shrink-0" style={{ color: WA.muted }} />
								<input
									value={librarySearch}
									onChange={e => setLibrarySearch(e.target.value)}
									onKeyDown={e => {
										if (e.key === 'Enter') void loadMetaLibrary(librarySearch);
									}}
									placeholder={t.metaLibrarySearch}
									className="w-full bg-transparent text-[13px] font-medium outline-none placeholder:text-black/45"
									style={{ color: WA.text }}
								/>
							</div>
							<button
								type="button"
								onClick={() => void loadMetaLibrary(librarySearch)}
								disabled={libraryLoading}
								className="inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-[12px] font-semibold text-white disabled:opacity-50"
								style={{ background: WA.green }}
							>
								{libraryLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
								{t.search}
							</button>
						</div>

						<div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5" style={chatWallpaperStyle}>
							{libraryLoading ? (
								<div className="grid place-items-center py-20">
									<LoaderCircle className="h-7 w-7 animate-spin" style={{ color: WA.green }} />
								</div>
							) : (
								<>
									{(libraryVerification.length > 0 || templates.some(tpl => tpl.name === 'hello_world')) && (
										<section className="mb-5">
											<div className="mb-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: WA.muted }}>
												{t.verificationTemplates}
											</div>
											<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
												{(libraryVerification.length
													? libraryVerification
													: [{ name: 'hello_world', language: 'en_US', category: 'UTILITY', body: 'Hello World sample', isVerification: true }]
												).map(item => {
													const accountTpl =
														templates.find(
															tpl =>
																tpl.name === item.name &&
																String(tpl.language) === String(item.language || 'en_US'),
														) || templates.find(tpl => tpl.name === item.name);
													return (
														<div
															key={`verify-${item.name}-${item.language}`}
															className="flex flex-col overflow-hidden rounded-2xl border"
															style={{ background: 'rgba(255,255,255,0.72)', borderColor: 'rgba(0,0,0,0.08)' }}
														>
															<div className="flex items-center justify-between gap-2 border-b px-3 py-2" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
																<div className="min-w-0">
																	<div className="truncate text-[12px] font-bold" style={{ color: WA.text }}>{item.name}</div>
																	<div className="truncate text-[10px]" style={{ color: WA.muted }}>
																		{item.language} · {item.category}
																		{accountTpl ? ` · ${accountTpl.status}` : ''}
																	</div>
																</div>
																<button
																	type="button"
																	onClick={() =>
																		openVerifySend({
																			...item,
																			components: accountTpl?.components || null,
																		})
																	}
																	className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white"
																	style={{ background: WA.green }}
																>
																	{t.verifySend}
																</button>
															</div>
															<div className="flex-1 p-3" style={chatWallpaperStyle}>
																<LibraryWaBubble item={item} />
															</div>
														</div>
													);
												})}
											</div>
										</section>
									)}

									<section>
										<div className="mb-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: WA.muted }}>
											{t.metaLibrary}
										</div>
										{!libraryItems.length ? (
											<p
												className="rounded-2xl border border-dashed px-4 py-12 text-center text-[13px]"
												style={{ color: WA.muted, borderColor: 'rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.65)' }}
											>
												{t.metaLibraryEmpty}
											</p>
										) : (
											<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
												{libraryItems.map(item => {
													const key = `${item.libraryTemplateName || item.name}::${item.language || ''}`;
													const creating = libraryCreatingKey === key;
													return (
														<div
															key={key}
															className="flex flex-col overflow-hidden rounded-2xl border"
															style={{ background: 'rgba(255,255,255,0.72)', borderColor: 'rgba(0,0,0,0.08)' }}
														>
															<div className="flex items-center justify-between gap-2 border-b px-3 py-2" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
																<div className="min-w-0">
																	<div className="truncate text-[12px] font-bold" style={{ color: WA.text }}>
																		{item.libraryTemplateName || item.name}
																	</div>
																	<div className="truncate text-[10px]" style={{ color: WA.muted }}>
																		{item.language} · {item.category}
																		{item.topic ? ` · ${item.topic}` : ''}
																	</div>
																</div>
																<button
																	type="button"
																	disabled={creating}
																	onClick={() => void onAddFromLibrary(item)}
																	className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
																	style={{ background: WA.green }}
																>
																	{creating ? '…' : t.addFromLibrary}
																</button>
															</div>
															<div className="flex-1 p-3" style={chatWallpaperStyle}>
																<LibraryWaBubble item={item} />
															</div>
														</div>
													);
												})}
											</div>
										)}
									</section>
								</>
							)}
						</div>
					</div>
				</div>
			)}

			{sendTemplateOpen && (
				<div className="absolute inset-0 z-40 grid place-items-center bg-[color-mix(in_srgb,var(--shell-ink)_35%,transparent)] p-4" onClick={() => setSendTemplateOpen(false)}>
					<form
						onSubmit={onSendTemplate}
						className="max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto rounded-2xl p-5"
						style={{ background: WA.panel }}
						onClick={e => e.stopPropagation()}
					>
						<div className="flex items-start justify-between gap-3">
							<div>
								<h3 className="text-lg font-semibold">{t.sendTemplate}</h3>
								<p className="mt-1 text-[12px] text-[var(--shell-muted)]">{t.templateApprovedOnly}</p>
							</div>
							<button type="button" onClick={() => setSendTemplateOpen(false)} className="p-1 text-[var(--shell-muted)]">
								<X className="h-4 w-4" />
							</button>
						</div>

						{templatesLoading ? (
							<p className="py-6 text-center text-sm text-[var(--shell-muted)]">…</p>
						) : !approvedTemplates.length ? (
							<p className="rounded-lg bg-[var(--color-warning-soft)] px-3 py-2 text-[12px] text-[var(--shell-muted)]">{t.templatesHint}</p>
						) : (
							<label className="block space-y-1.5">
								<span className="text-[12px] font-medium text-[var(--shell-muted)]">{t.templatePick}</span>
								<select
									value={selectedTemplateKey}
									onChange={e => {
										setSelectedTemplateKey(e.target.value);
										setTemplateVarValues({});
										setTemplateVarErrors({});
									}}
									required
									className="w-full rounded-lg border border-[var(--shell-line)] bg-[var(--shell-line)] px-3 py-2 text-sm outline-none"
								>
									<option value="">{t.templatePick}</option>
									{approvedTemplates.map(tpl => (
										<option key={`${tpl.name}::${tpl.language}`} value={`${tpl.name}::${tpl.language}`}>
											{tpl.name} ({tpl.language})
										</option>
									))}
								</select>
							</label>
						)}

						{selectedTemplate && templatePreviewText(selectedTemplate.components) ? (
							<p className="rounded-lg bg-[var(--shell-line)] px-3 py-2 text-[12px] text-[var(--shell-muted)] whitespace-pre-wrap">
								{templatePreviewText(selectedTemplate.components)}
							</p>
						) : null}

						{selectedTemplate && selectedPlaceholders.length === 0 ? (
							<p className="text-[12px] text-[var(--color-positive)]">{t.templateNoVars}</p>
						) : null}

						{selectedPlaceholders.length > 0 ? (
							<div className="space-y-2">
								<div className="text-[13px] font-semibold">{t.templateVarsTitle}</div>
								{selectedPlaceholders.map(p => {
									const isUrlBtn = p.component === 'BUTTON';
									const err = templateVarErrors[p.id];
									return (
										<label key={p.id} className="block space-y-1">
											<span className="text-[12px] text-[var(--shell-muted)]">{p.label}</span>
											<input
												dir="ltr"
												value={templateVarValues[p.id] || ''}
												onChange={e => {
													const next = e.target.value;
													setTemplateVarValues(v => ({ ...v, [p.id]: next }));
													setTemplateVarErrors(errs => {
														if (!errs[p.id]) return errs;
														const copy = { ...errs };
														delete copy[p.id];
														return copy;
													});
												}}
												required
												placeholder={isUrlBtn ? t.templateUrlParamPlaceholder : undefined}
												className={`w-full rounded-lg border bg-[var(--color-surface-elevated)] px-3 py-2 text-sm outline-none ${
													err
														? 'border-[var(--color-negative)] focus:border-[var(--color-negative)]'
														: 'border-[var(--shell-line)] focus:border-[var(--color-positive)]'
												}`}
											/>
											{isUrlBtn ? (
												<p className="text-[11px] text-[var(--shell-muted)]">{t.templateUrlParamHint}</p>
											) : null}
											{err ? (
												<p className="text-[11px] font-medium text-[var(--color-negative)]">{err}</p>
											) : null}
										</label>
									);
								})}
							</div>
						) : null}

						<div className="flex justify-end gap-2 pt-1">
							<Button type="button" variant="ghost" onClick={() => setSendTemplateOpen(false)}>
								{t.cancel}
							</Button>
							<Button type="submit" disabled={sending || !selectedTemplate} loading={sending}>
								{t.sendTemplate}
							</Button>
						</div>
					</form>
				</div>
			)}

			{previewTemplate && (
				<div
					className="absolute inset-0 z-50 grid place-items-center bg-[color-mix(in_srgb,var(--shell-ink)_35%,transparent)] p-4"
					onClick={() => setPreviewTemplate(null)}
				>
					<div
						className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-2xl p-5"
						style={{ background: WA.panel }}
						onClick={e => e.stopPropagation()}
					>
						<div className="flex items-start justify-between gap-3">
							<div>
								<h3 className="text-lg font-semibold">{t.templatePreviewTitle}</h3>
								<p className="mt-1 text-[12px] text-[var(--shell-muted)]">
									{previewTemplate.name} · {previewTemplate.language} · {previewTemplate.category || '—'} ·{' '}
									{previewTemplate.status || '—'}
								</p>
							</div>
							<button type="button" onClick={() => setPreviewTemplate(null)} className="p-1 text-[var(--shell-muted)]">
								<X className="h-4 w-4" />
							</button>
						</div>

						<div className="flex justify-start rounded-xl p-4" style={{ ...chatWallpaperStyle, minHeight: 120 }}>
							<div
								className="max-w-[360px] min-w-[160px] overflow-hidden text-[13px] shadow-[0_1px_0_rgba(0,0,0,0.06)]"
								style={{ background: WA.bubbleIn, color: WA.text, borderRadius: 12 }}
							>
								{templateHeaderFormat(previewTemplate.components) === 'IMAGE' ? (
									<div className="flex h-28 items-center justify-center" style={{ background: 'var(--shell-line)' }}>
										<ImageIcon className="h-7 w-7" style={{ color: WA.muted }} />
									</div>
								) : null}
								{templateHeaderFormat(previewTemplate.components) === 'VIDEO' ? (
									<div className="flex h-28 items-center justify-center" style={{ background: 'var(--shell-line)' }}>
										<Video className="h-7 w-7" style={{ color: WA.muted }} />
									</div>
								) : null}
								{templateHeaderFormat(previewTemplate.components) === 'DOCUMENT' ? (
									<div className="flex items-center gap-2 px-3 pt-2.5">
										<FileText className="h-5 w-5" style={{ color: WA.muted }} />
										<span className="text-[12px]" style={{ color: WA.muted }}>Document</span>
									</div>
								) : null}
								<div className="px-3 py-2">
									{templateHeaderText(previewTemplate.components) ? (
										<div className="mb-1 text-[12px] font-bold">{templateHeaderText(previewTemplate.components)}</div>
									) : null}
									<div className="whitespace-pre-wrap break-words">
										{templatePreviewText(previewTemplate.components) || '—'}
									</div>
									{templateFooterText(previewTemplate.components) ? (
										<div className="mt-1 text-[11px]" style={{ color: WA.muted }}>
											{templateFooterText(previewTemplate.components)}
										</div>
									) : null}
								</div>
								{templateButtons(previewTemplate.components).length ? (
									<div className="border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
										{templateButtons(previewTemplate.components).map((btn, i) => (
											<div
												key={`${btn.text}-${i}`}
												className="flex items-center justify-center gap-1.5 border-t px-3 py-2 text-[13px] font-semibold"
												style={{
													borderColor: i === 0 ? 'transparent' : 'rgba(0,0,0,0.06)',
													color: 'var(--shell-blue)',
												}}
											>
												{String(btn.type).toUpperCase() === 'URL' ? <Link2 className="h-3.5 w-3.5" /> : null}
												{String(btn.type).toUpperCase() === 'PHONE_NUMBER' ? <PubIcon src={PUB.phone} className="h-3.5 w-3.5 object-contain" /> : null}
												{btn.text}
											</div>
										))}
									</div>
								) : null}
							</div>
						</div>

						<div className="flex flex-wrap justify-end gap-2 pt-1">
							<button
								type="button"
								onClick={() => void copyTemplateName(previewTemplate.name)}
								className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm"
								style={{ background: WA.field, color: WA.text }}
							>
								<Copy className="h-3.5 w-3.5" />
								{t.templateCopyName}
							</button>
							{canEditMetaTemplate(previewTemplate) ? (
								<button
									type="button"
									onClick={() => openEditTemplate(previewTemplate)}
									className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold"
									style={{ background: WA.field, color: WA.text }}
								>
									<Pencil className="h-3.5 w-3.5" />
									{t.templateEdit}
								</button>
							) : null}
							{String(previewTemplate.status).toUpperCase() === 'APPROVED' ? (
								<button
									type="button"
									onClick={() => {
										const tpl = previewTemplate;
										setPreviewTemplate(null);
										openVerifySend(tpl);
									}}
									className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-white"
									style={{ background: WA.green }}
								>
									<Send className="h-3.5 w-3.5" />
									{t.templateUse}
								</button>
							) : null}
							<button
								type="button"
								onClick={() => {
									const tpl = previewTemplate;
									setPreviewTemplate(null);
									void onDeleteTemplate(tpl);
								}}
								className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold"
								style={{ background: 'var(--color-negative-soft)', color: 'var(--color-negative)' }}
							>
								<Trash2 className="h-3.5 w-3.5" />
								{t.templateDelete}
							</button>
						</div>
					</div>
				</div>
			)}

			{verifyOpen && verifyTemplate && (
				<div
					className="absolute inset-0 z-50 grid place-items-center bg-[color-mix(in_srgb,var(--shell-ink)_35%,transparent)] p-4"
					onClick={() => {
						setVerifyOpen(false);
						setVerifyTemplate(null);
					}}
				>
					<form
						onSubmit={onVerifySend}
						className="max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto rounded-2xl p-5"
						style={{ background: WA.panel }}
						onClick={e => e.stopPropagation()}
					>
						<div className="flex items-start justify-between gap-3">
							<div>
								<h3 className="text-lg font-semibold">{t.verifySendTitle}</h3>
								<p className="mt-1 text-[12px] text-[var(--shell-muted)]">{t.verifySendHint}</p>
							</div>
							<button
								type="button"
								onClick={() => {
									setVerifyOpen(false);
									setVerifyTemplate(null);
								}}
								className="p-1 text-[var(--shell-muted)]"
							>
								<X className="h-4 w-4" />
							</button>
						</div>

						<div className="rounded-lg bg-[var(--shell-line)] px-3 py-2 text-[12px] text-[var(--shell-muted)]">
							<div className="font-semibold text-[var(--shell-ink)]">
								{verifyTemplate.name} · {verifyTemplate.language}
							</div>
							{verifyTemplate.body ? (
								<p className="mt-1 whitespace-pre-wrap">{verifyTemplate.body}</p>
							) : null}
						</div>

						<label className="block space-y-1.5">
							<span className="text-[12px] font-medium text-[var(--shell-muted)]">{t.openPhone}</span>
							<input
								type="tel"
								inputMode="tel"
								dir="ltr"
								required
								value={verifyPhone}
								onChange={e => setVerifyPhone(e.target.value)}
								placeholder={t.phonePlaceholder}
								className="w-full rounded-lg border border-[var(--shell-line)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--color-positive)]"
							/>
							<p className="text-[11px] text-[var(--shell-muted)]">{t.phoneHint}</p>
						</label>

						{extractTemplatePlaceholders(verifyTemplate.components).length > 0 ? (
							<div className="space-y-2">
								<div className="text-[13px] font-semibold">{t.templateVarsTitle}</div>
								{extractTemplatePlaceholders(verifyTemplate.components).map(p => {
									const isUrlBtn = p.component === 'BUTTON';
									const err = templateVarErrors[p.id];
									return (
										<label key={p.id} className="block space-y-1">
											<span className="text-[12px] text-[var(--shell-muted)]">{p.label}</span>
											<input
												dir="ltr"
												value={templateVarValues[p.id] || ''}
												onChange={e => {
													const next = e.target.value;
													setTemplateVarValues(v => ({ ...v, [p.id]: next }));
													setTemplateVarErrors(errs => {
														if (!errs[p.id]) return errs;
														const copy = { ...errs };
														delete copy[p.id];
														return copy;
													});
												}}
												required
												placeholder={isUrlBtn ? t.templateUrlParamPlaceholder : undefined}
												className={`w-full rounded-lg border bg-[var(--color-surface-elevated)] px-3 py-2 text-sm outline-none ${
													err
														? 'border-[var(--color-negative)] focus:border-[var(--color-negative)]'
														: 'border-[var(--shell-line)] focus:border-[var(--color-positive)]'
												}`}
											/>
											{isUrlBtn ? (
												<p className="text-[11px] text-[var(--shell-muted)]">{t.templateUrlParamHint}</p>
											) : null}
											{err ? (
												<p className="text-[11px] font-medium text-[var(--color-negative)]">{err}</p>
											) : null}
										</label>
									);
								})}
							</div>
						) : (
							<p className="text-[12px] text-[var(--color-positive)]">{t.templateNoVars}</p>
						)}

						<div className="flex justify-end gap-2 pt-1">
							<Button
								type="button"
								variant="ghost"
								onClick={() => {
									setVerifyOpen(false);
									setVerifyTemplate(null);
								}}
							>
								{t.cancel}
							</Button>
							<Button type="submit" disabled={sending} loading={sending}>
								{t.verifySend}
							</Button>
						</div>
					</form>
				</div>
			)}

			{quickRepliesOpen && (
				<div
					className="absolute inset-0 z-40 grid place-items-end bg-[color-mix(in_srgb,var(--shell-ink)_35%,transparent)] p-3 sm:place-items-center sm:p-4"
					onClick={() => setQuickRepliesOpen(false)}
				>
					<div
						className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
						style={{ background: WA.panel }}
						onClick={e => e.stopPropagation()}
					>
						<header
							className="flex items-start justify-between gap-3 border-b px-4 py-3"
							style={{ borderColor: WA.border }}
						>
							<div className="min-w-0">
								<div className="flex items-center gap-2">
									<span
										className="grid h-8 w-8 place-items-center rounded-xl"
										style={{ background: WA.greenSoft, color: WA.greenText }}
									>
										<Zap className="h-4 w-4" />
									</span>
									<div>
										<h3 className="text-[15px] font-bold" style={{ color: WA.text }}>
											{t.fastReplies}
										</h3>
										<p className="text-[11px]" style={{ color: WA.muted }}>
											{t.fastRepliesHint}
										</p>
									</div>
								</div>
							</div>
							<button
								type="button"
								onClick={() => setQuickRepliesOpen(false)}
								className="rounded-lg p-1.5 transition hover:bg-[var(--color-surface-soft)]"
								style={{ color: WA.icon }}
							>
								<X className="h-4 w-4" />
							</button>
						</header>

						<div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
							{quickRepliesLoading ? (
								<div className="flex items-center justify-center gap-2 py-10 text-[12px]" style={{ color: WA.muted }}>
									<LoaderCircle className="h-4 w-4 animate-spin" />
									…
								</div>
							) : quickReplies.length === 0 ? (
								<p className="py-8 text-center text-[12px]" style={{ color: WA.muted }}>
									{t.fastReplyEmpty}
								</p>
							) : (
								quickReplies.map(reply => (
									<div
										key={reply.id}
										className="group flex items-start gap-2 rounded-xl border px-3 py-2.5 transition hover:bg-[var(--color-surface-soft)]"
										style={{ borderColor: WA.border }}
									>
										<button
											type="button"
											className="min-w-0 flex-1 text-start"
											onClick={() => useQuickReply(reply)}
										>
											<div className="flex items-center gap-1.5">
												<span className="text-[13px] font-semibold" style={{ color: WA.text }}>
													{reply.title}
												</span>
												{reply.isDefault ? (
													<span
														className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
														style={{ background: WA.greenSoft, color: WA.greenText }}
													>
														default
													</span>
												) : null}
											</div>
											<p
												className="mt-0.5 line-clamp-3 whitespace-pre-wrap text-[11px] leading-snug"
												style={{ color: WA.muted }}
											>
												{reply.body}
											</p>
										</button>
										{!reply.isDefault ? (
											<button
												type="button"
												title={t.fastReplyDelete}
												onClick={() => void deleteQuickReply(reply.id)}
												className="shrink-0 rounded-lg p-1.5 opacity-60 transition hover:bg-[var(--color-negative-soft)] hover:opacity-100"
												style={{ color: 'var(--color-negative)' }}
											>
												<Trash2 className="h-3.5 w-3.5" />
											</button>
										) : null}
									</div>
								))
							)}
						</div>

						<div className="border-t px-3 py-3" style={{ borderColor: WA.border }}>
							{quickReplyFormOpen ? (
								<form onSubmit={e => void saveQuickReply(e)} className="space-y-2">
									<input
										value={quickReplyTitle}
										onChange={e => setQuickReplyTitle(e.target.value)}
										placeholder={t.fastReplyTitle}
										className="w-full rounded-xl border px-3 py-2 text-[13px] outline-none"
										style={{ borderColor: WA.border, color: WA.text }}
										required
									/>
									<textarea
										value={quickReplyBody}
										onChange={e => setQuickReplyBody(e.target.value)}
										placeholder={t.fastReplyBody}
										rows={4}
										className="w-full resize-none rounded-xl border px-3 py-2 text-[13px] outline-none"
										style={{ borderColor: WA.border, color: WA.text }}
										required
									/>
									<div className="flex justify-end gap-2">
										<Button
											type="button"
											variant="ghost"
											onClick={() => setQuickReplyFormOpen(false)}
										>
											{t.cancel}
										</Button>
										<Button type="submit" disabled={quickReplySaving} loading={quickReplySaving}>
											{t.fastReplySave || t.save}
										</Button>
									</div>
								</form>
							) : (
								<div className="flex gap-2">
									{draft.trim() ? (
										<button
											type="button"
											onClick={() => {
												setQuickReplyBody(draft.trim());
												setQuickReplyTitle('');
												setQuickReplyFormOpen(true);
											}}
											className="flex-1 rounded-xl border px-3 py-2 text-[12px] font-semibold transition hover:bg-[var(--color-surface-soft)]"
											style={{ borderColor: WA.border, color: WA.text }}
										>
											{isAr ? 'حفظ المسودة كرد' : 'Save draft as reply'}
										</button>
									) : null}
									<button
										type="button"
										onClick={() => {
											setQuickReplyTitle('');
											setQuickReplyBody('');
											setQuickReplyFormOpen(true);
										}}
										className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold text-white"
										style={{ background: WA.green }}
									>
										<Plus className="h-3.5 w-3.5" />
										{t.fastReplyAdd}
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			<PhoneImportReviewDialog
				open={importOpen}
				rows={importRows}
				busy={importBusy}
				t={t}
				onChange={(index, next) => {
					setImportRows(prev =>
						revalidateImportRows(
							prev.map((row, i) => (i === index ? { ...row, phone: next.phone, displayName: next.displayName } : row)),
						),
					);
				}}
				onClose={() => {
					if (importBusy) return;
					setImportOpen(false);
					setImportRows([]);
				}}
				onSave={onSaveImportedPhones}
			/>

			{mediaLightbox?.url ? (
				<MediaLightbox
					url={mediaLightbox.url}
					kind={mediaLightbox.kind}
					onClose={() => setMediaLightbox(null)}
				/>
			) : null}
		</div>
	);
}
