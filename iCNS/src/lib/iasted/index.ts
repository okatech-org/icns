/**
 * Barrel iAsted — exports publics du package interne.
 */

export {
    iAstedSoul,
    derivePersona,
    type IAstedRole,
    type FormalityLevel,
    type ClassificationLevel,
    type Persona,
    type SpatialAwareness,
    type ConversationContext,
    type SoulState,
} from './soul';

export {
    getPageContext,
    getPageSuggestions,
    isLegacyRoute,
    type PageContext,
} from './spatial-awareness';

export {
    classifyIntent,
    type Intent,
    type ToolIntent,
    type AnswerIntent,
    type UnknownIntent,
    type IntentKind,
} from './intent-engine';

export {
    KNOWLEDGE_BASE,
    lookupKnowledge,
    type KnowledgeEntry,
} from './knowledge';

export {
    pageContextStore,
    usePublishPageContext,
    useIAstedPageContext,
    getCurrentPageContext,
    executePageAction,
    findActionByVoice,
    type PageContextSnapshot,
    type PageEntity,
    type PageAction,
} from './page-context-store';

export {
    formatPageContextForVoice,
    describePageContextForSpeech,
    listPageActionTriggers,
} from './format-page-context';
