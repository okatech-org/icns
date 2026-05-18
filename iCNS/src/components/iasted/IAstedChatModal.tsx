import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { generateOfficialPDFWithURL } from '@/utils/generateOfficialPDF';
import { documentGenerationService } from '@/services/documentGenerationService';
import {
  Send,
  Loader2,
  X,
  Bot,
  User,
  FileText,
  Download,
  Brain,
  Mic,
  MicOff,
  Navigation,
  Settings,
  FileCheck,
  Trash2,
  Edit,
  Copy,
  MoreVertical,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeVoiceWebRTC, UseRealtimeVoiceWebRTC } from '@/hooks/useRealtimeVoiceWebRTC';
import { DocumentUploadZone } from '@/components/iasted/DocumentUploadZone';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    responseStyle?: string;
    documents?: Array<{
      id: string;
      name: string;
      url: string;
      type: string;
    }>;
  };
}

interface IAstedChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  openaiRTC: UseRealtimeVoiceWebRTC;
  pendingDocument?: any;
  onClearPendingDocument?: () => void;
  currentVoice?: 'echo' | 'ash' | 'shimmer';
  systemPrompt?: string;
}

const MessageBubble: React.FC<{
  message: Message;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, newContent: string) => void;
  onCopy?: (content: string) => void;
}> = ({ message, onDelete, onEdit, onCopy }) => {
  const isUser = message.role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  const [fullscreenDoc, setFullscreenDoc] = useState<any>(null);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [pdfPage, setPdfPage] = useState(1);
  const { toast } = useToast();

  const handleSaveEdit = () => {
    if (onEdit && editedContent.trim() !== message.content) {
      onEdit(message.id, editedContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  const handleDownloadDocument = (doc: any) => {
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "📥 Téléchargement",
      description: `${doc.name} téléchargé`,
    });
  };

  const handlePrintDocument = (doc: any) => {
    const printWindow = window.open(doc.url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
      toast({
        title: "🖨️ Impression",
        description: `Ouverture de ${doc.name} pour impression`,
      });
    } else {
      toast({
        title: "❌ Erreur",
        description: "Impossible d'ouvrir la fenêtre d'impression. Veuillez autoriser les pop-ups.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'} relative`}>
        <div className="flex items-start gap-2">
          {!isUser && (
            <div className="neu-raised w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-success/10">
              <Bot className="w-4 h-4 text-success" />
            </div>
          )}
          <div className="flex-1">
            <div
              className={`rounded-2xl px-4 py-3 ${isUser
                ? 'neu-raised bg-primary/10 text-foreground rounded-br-none'
                : 'neu-inset text-foreground rounded-bl-none'
                }`}
            >
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full min-h-[80px] p-2 bg-background/50 border border-border rounded text-sm resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-xs rounded bg-background/50 hover:bg-background transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              )}

              {/* Documents attachés avec prévisualisation PDF */}
              {message.metadata?.documents && message.metadata.documents.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/20 space-y-3">
                  {message.metadata.documents.map((doc) => (
                    <div key={doc.id} className="space-y-2">
                      {/* Nom et boutons d'action */}
                      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background/50">
                        <div className="flex items-center gap-2 flex-1">
                          <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-xs font-medium truncate">{doc.name}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setFullscreenDoc(doc)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-background/70 hover:bg-background text-foreground transition-colors"
                            title="Plein écran"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5v4m0-4h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(doc)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Télécharger</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Modale plein écran pour PDF */}
              <AnimatePresence>
                {fullscreenDoc && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex flex-col"
                    onClick={() => setFullscreenDoc(null)}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border bg-background/50">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">{fullscreenDoc.name}</span>
                      </div>

                      {/* Contrôles */}
                      <div className="flex items-center gap-4">
                        {/* Zoom */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/70 border border-border">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPdfZoom(prev => Math.max(50, prev - 25));
                            }}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Zoom arrière"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                            </svg>
                          </button>
                          <span className="text-xs font-medium min-w-[3rem] text-center">{pdfZoom}%</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPdfZoom(prev => Math.min(200, prev + 25));
                            }}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Zoom avant"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPdfZoom(100);
                            }}
                            className="p-1 hover:bg-muted rounded transition-colors ml-1"
                            title="Réinitialiser"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/70 border border-border">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPdfPage(prev => Math.max(1, prev - 1));
                            }}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Page précédente"
                            disabled={pdfPage === 1}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <span className="text-xs font-medium min-w-[4rem] text-center">Page {pdfPage}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPdfPage(prev => prev + 1);
                            }}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Page suivante"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintDocument(fullscreenDoc);
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background hover:bg-muted transition-colors"
                          title="Imprimer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          <span className="text-sm font-medium">Imprimer</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadDocument(fullscreenDoc);
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-sm font-medium">Télécharger</span>
                        </button>

                        <button
                          onClick={() => {
                            setFullscreenDoc(null);
                            setPdfZoom(100);
                            setPdfPage(1);
                          }}
                          className="flex items-center justify-center w-10 h-10 rounded-lg bg-background hover:bg-muted transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* PDF Viewer avec object au lieu d'iframe */}
                    <div className="flex-1 p-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                      <object
                        data={`${fullscreenDoc.url}#page=${pdfPage}&zoom=${pdfZoom}`}
                        type="application/pdf"
                        className="w-full h-full rounded-lg border border-border bg-background"
                        style={{ transform: `scale(${pdfZoom / 100})`, transformOrigin: 'top center' }}
                      >
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                          <FileText className="w-16 h-16 text-muted-foreground" />
                          <div>
                            <p className="text-lg font-medium mb-2">Prévisualisation non disponible</p>
                            <p className="text-sm text-muted-foreground mb-4">
                              Votre navigateur ne peut pas afficher ce PDF directement.
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadDocument(fullscreenDoc);
                              }}
                              className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                              Télécharger le PDF
                            </button>
                          </div>
                        </div>
                      </object>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                <span className="text-xs opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {!isUser && message.metadata?.responseStyle && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {message.metadata.responseStyle === 'concis' && '⚡ Concis'}
                    {message.metadata.responseStyle === 'detaille' && '📊 Détaillé'}
                    {message.metadata.responseStyle === 'strategique' && '🎯 Stratégique'}
                  </span>
                )}
              </div>
            </div>

            {/* Actions au survol */}
            <AnimatePresence>
              {showActions && !isEditing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute -top-2 right-0 flex gap-1 bg-background border border-border rounded-lg shadow-lg p-1"
                >
                  {isUser && onEdit && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 hover:bg-primary/10 rounded transition-colors"
                      title="Éditer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {onCopy && (
                    <button
                      onClick={() => onCopy(message.content)}
                      className="p-1.5 hover:bg-primary/10 text-primary rounded transition-colors"
                      title="Copier"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(message.id)}
                      className="p-1.5 hover:bg-destructive/10 text-destructive rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {isUser && (
            <div className="neu-raised w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
              <User className="w-4 h-4 text-primary" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

import { commandService } from '@/services/iasted/CommandService';

export const IAstedChatModal: React.FC<IAstedChatModalProps> = ({
  isOpen,
  onClose,
  openaiRTC,
  pendingDocument,
  onClearPendingDocument,
  currentVoice,
  systemPrompt
}) => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState<'auto-power' | 'auto-cost' | 'manual'>('auto-power');
  const [manualModel, setManualModel] = useState<string>('gpt-4o');
  const [selectedVoice, setSelectedVoice] = useState<'echo' | 'ash' | 'shimmer'>(() => {
    return currentVoice || (localStorage.getItem('iasted-voice-selection') as 'echo' | 'ash' | 'shimmer') || 'ash';
  });

  // Sync internal state with prop if it changes (e.g. via voice command)
  useEffect(() => {
    if (currentVoice && currentVoice !== selectedVoice) {
      setSelectedVoice(currentVoice);
    }
  }, [currentVoice]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  // Initialize CommandService with context
  useEffect(() => {
    commandService.setContext({
      navigate,
      setTheme
    });
  }, [navigate, setTheme]);

  // OpenAI WebRTC integration is now passed via props
  // const openaiRTC = useRealtimeVoiceWebRTC();

  // Auto-start voice when modal opens
  useEffect(() => {
    if (isOpen) {
      // Petit délai pour laisser l'UI se monter
      const timer = setTimeout(() => {
        if (!openaiRTC.isConnected) {
          openaiRTC.connect(selectedVoice);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedVoice]); // Reconnect if voice changes while open? Maybe not automatically, let user decide.

  // Sync messages from OpenAI WebRTC
  useEffect(() => {
    if (openaiRTC.messages.length > 0) {
      const lastMsg = openaiRTC.messages[openaiRTC.messages.length - 1];

      // Check for voice commands if it's a user message
      if (lastMsg.role === 'user') {
        const command = commandService.findCommand(lastMsg.content);
        if (command) {
          console.log('🎤 [Voice Command] Detected:', command.name);
          commandService.execute(command.id);

          // Add system feedback message
          const feedbackMsg: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `✅ Action exécutée : ${command.name}`,
            timestamp: new Date().toISOString(),
            metadata: { responseStyle: 'concis' }
          };
          setMessages(prev => [...prev, lastMsg, feedbackMsg]);
          return;
        }
      }

      setMessages(prev => {
        const existing = prev.find(m => m.id === lastMsg.id);
        if (!existing) {
          return [...prev, lastMsg];
        }
        return prev.map(m => m.id === lastMsg.id ? lastMsg : m);
      });
    }
  }, [openaiRTC.messages]);

  // === Fonctions de gestion de messages ===

  const handleDeleteMessage = async (messageId: string) => {
    try {
      setMessages(prev => prev.filter(m => m.id !== messageId));

      // Supprimer aussi de la base de données
      if (sessionId) {
        const { error } = await supabase
          .from('conversation_messages')
          .delete()
          .eq('id', messageId);

        if (error) console.error('Erreur suppression message:', error);
      }

      toast({
        title: "Message supprimé",
        duration: 2000,
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, content: newContent } : m
      ));

      // Mettre à jour dans la base de données
      if (sessionId) {
        const { error } = await supabase
          .from('conversation_messages')
          .update({ content: newContent })
          .eq('id', messageId);

        if (error) console.error('Erreur modification message:', error);
      }

      toast({
        title: "Message modifié",
        duration: 2000,
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "📋 Copié",
      description: "Message copié dans le presse-papiers",
      duration: 2000,
    });
  };

  const handleClearConversation = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer toute la conversation ?')) {
      setMessages([]);
      openaiRTC.clearSession(); // Clear WebRTC session history
      if (sessionId) {
        // Supprimer tous les messages de la session
        const { error: deleteError } = await supabase
          .from('conversation_messages')
          .delete()
          .eq('session_id', sessionId);

        if (deleteError) {
          console.error('Erreur suppression messages:', deleteError);
        }

        // Marquer la session comme terminée pour ne plus la recharger
        const { error: updateError } = await supabase
          .from('conversation_sessions')
          .update({
            ended_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);

        if (updateError) {
          console.error('Erreur mise à jour session:', updateError);
        }
      }
      toast({
        title: "Conversation effacée",
        duration: 2000,
      });
    }
  };

  const handleNewConversation = async () => {
    setMessages([]);
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);

    // Créer nouvelle session
    await supabase.from('conversation_sessions').insert({
      session_id: newSessionId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      started_at: new Date().toISOString(),
    });

    toast({
      title: "✨ Nouvelle conversation",
      duration: 2000,
    });
  };


  // Initialiser la session au montage
  useEffect(() => {
    if (isOpen) {
      initializeSession();
    }
  }, [isOpen]);

  // Gérer la génération de documents déclenchée par commande vocale
  useEffect(() => {
    if (pendingDocument && onClearPendingDocument) {
      console.log('📄 [IAstedChatModal] Génération de document depuis voix:', pendingDocument);

      // Créer un tool call simulé pour réutiliser la logique existante
      const toolCall = {
        function: {
          name: 'generate_document',
          arguments: JSON.stringify({
            type: pendingDocument.type,
            recipient: pendingDocument.recipient,
            subject: pendingDocument.subject,
            content_points: pendingDocument.contentPoints,
            format: pendingDocument.format || 'pdf',
            service_context: pendingDocument.serviceContext
          })
        }
      };

      executeToolCall(toolCall);
      onClearPendingDocument();
    }
  }, [pendingDocument, onClearPendingDocument]);

  // Listen for clear history event from SuperAdminContext
  useEffect(() => {
    const handleClearEvent = () => {
      console.log('🧹 [IAstedChatModal] Received clear history event');
      handleClearConversation();
    };

    window.addEventListener('iasted-clear-history', handleClearEvent);
    return () => window.removeEventListener('iasted-clear-history', handleClearEvent);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeSession = async () => {
    try {
      console.log('🔄 [IAstedChatModal] Initialisation session...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Chercher ou créer une session
      const { data: existingSession } = await supabase
        .from('conversation_sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('ended_at', null)
        .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSession) {
        setSessionId(existingSession.id);
        await loadSessionMessages(existingSession.id);
      } else {
        const { data: newSession, error } = await supabase
          .from('conversation_sessions')
          .insert({
            user_id: user.id,
            settings: { mode: 'text' },
            focus_mode: null,
          })
          .select()
          .single();

        if (error) throw error;
        setSessionId(newSession.id);

        // Message de bienvenue
        const greetingMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Bonjour Monsieur le Président,\n\nJe suis iAsted, votre assistant stratégique. Comment puis-je vous aider aujourd'hui ?`,
          timestamp: new Date().toISOString(),
          metadata: { responseStyle: 'strategique' },
        };
        setMessages([greetingMessage]);
        await saveMessage(newSession.id, greetingMessage);
      }

      console.log('✅ [IAstedChatModal] Session prête');
    } catch (error) {
      console.error('❌ [IAstedChatModal] Erreur initialisation:', error);
      toast({
        title: 'Erreur de session',
        description: 'Impossible d\'initialiser la conversation',
        variant: 'destructive',
      });
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    const { data: msgs, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!error && msgs) {
      setMessages(msgs.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.created_at,
      })));
    }
  };

  // Fonction d'exécution des tool calls
  const executeToolCall = async (toolCall: any) => {
    try {
      const args = JSON.parse(toolCall.function.arguments);
      console.log('🔧 [executeToolCall]', toolCall.function.name, args);

      switch (toolCall.function.name) {
        case 'navigate_app':
          toast({
            title: "Navigation",
            description: `Redirection vers ${args.route}...`,
            duration: 2000,
          });
          navigate(args.route);

          // Si un module spécifique est demandé, scroller vers lui
          if (args.module_id) {
            setTimeout(() => {
              const element = document.getElementById(args.module_id);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('ring-2', 'ring-primary', 'animate-pulse');
                setTimeout(() => {
                  element.classList.remove('ring-2', 'ring-primary', 'animate-pulse');
                }, 3000);
              }
            }, 500);
          }
          break;

        case 'generate_document':
          // Gérer le format (PDF ou Docx)
          const requestedFormat = args.format || 'pdf';
          console.log(`📄 [generateDocument] Format demandé: ${requestedFormat}`, args);

          try {
            let blob: Blob, url: string, filename: string;

            if (requestedFormat === 'docx') {
              // Génération DOCX locale sans upload vers Supabase
              console.log('📄 [generateDOCX] Génération locale du DOCX');

              const { Document, Paragraph, AlignmentType, HeadingLevel, Packer } = await import('docx');

              const title = `${args.type} - ${args.recipient}`;
              const contentPoints = args.content_points || [];

              const doc = new Document({
                sections: [{
                  properties: {},
                  children: [
                    new Paragraph({
                      text: "RÉPUBLIQUE GABONAISE",
                      heading: HeadingLevel.HEADING_1,
                      alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                      text: title,
                      heading: HeadingLevel.HEADING_2,
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 400, after: 400 },
                    }),
                    new Paragraph({
                      text: `Destinataire: ${args.recipient}`,
                      spacing: { before: 200, after: 200 },
                    }),
                    new Paragraph({
                      text: `Objet: ${args.subject}`,
                      spacing: { after: 200 },
                    }),
                    new Paragraph({
                      text: `Date: ${new Date().toLocaleDateString('fr-FR')}`,
                      spacing: { after: 400 },
                    }),
                    ...contentPoints.map((point: string) =>
                      new Paragraph({
                        text: point,
                        spacing: { before: 200, after: 200 },
                      })
                    ),
                  ],
                }],
              });

              blob = await Packer.toBlob(doc);
              filename = `${args.type}_${args.recipient.replace(/\s+/g, '_')}_${Date.now()}.docx`;
              url = URL.createObjectURL(blob);

              console.log('✅ [generateDOCX] Document généré:', filename);
            } else {
              // Génération PDF existante
              const pdfResult = await generateOfficialPDFWithURL({
                type: args.type,
                recipient: args.recipient,
                subject: args.subject,
                content_points: args.content_points || [],
                signature_authority: args.signature_authority,
                serviceContext: args.service_context
              });

              blob = pdfResult.blob;
              url = pdfResult.url;
              filename = pdfResult.filename;

              console.log('✅ [generatePDF] Document généré:', filename);
            }

            // Créer l'objet document pour le chat
            const docPreview = {
              id: crypto.randomUUID(),
              name: filename,
              url: url,  // URL blob pour téléchargement
              type: requestedFormat === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf',
            };

            // Créer un message assistant dédié avec le document attaché
            const now = new Date().toISOString();
            const content = `Document généré, Excellence.\n\n📄 ${args.type.toUpperCase()} pour ${args.recipient}\nObjet : ${args.subject}`;
            const docMessage: Message = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content,
              timestamp: now,
              metadata: {
                responseStyle: 'strategique',
                documents: [docPreview],
              },
            };

            setMessages(prev => [...prev, docMessage]);

            // Toast de succès
            toast({
              title: "📄 Document généré",
              description: `${args.type.toUpperCase()} pour ${args.recipient}`,
              duration: 3000,
            });

            // Télécharger automatiquement le PDF au lieu de l'ouvrir (évite ERR_BLOCKED_BY_CLIENT)
            // Si on est en mode vocal (connecté), on télécharge auto
            if (openaiRTC.isConnected) {
              console.log('🔊 [generatePDF] Téléchargement automatique (demande vocale)');
              setTimeout(() => {
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }, 500);
            }

          } catch (error) {
            console.error('❌ [generatePDF] Erreur:', error);
            toast({
              title: "Erreur de génération",
              description: "Impossible de créer le document PDF",
              variant: "destructive",
            });
          }
          break;

        case 'manage_system_settings':
          if (args.setting === 'voice_mode') {
            // Legacy support or ignore
            console.log('Setting voice mode via tool is deprecated');
          } else if (args.setting === 'theme') {
            setTheme(args.value);
            toast({
              title: "Thème changé",
              description: `Nouveau thème: ${args.value}`,
            });
          }
          break;

        default:
          console.warn('⚠️ [executeToolCall] Outil non reconnu:', toolCall.function.name);
      }
    } catch (error) {
      console.error('❌ [executeToolCall] Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'exécuter l'action",
        variant: "destructive",
      });
    }
  };

  // Sauvegarder le message dans Supabase
  const saveMessage = async (sessionId: string, message: Message) => {
    try {
      const { error } = await supabase
        .from('conversation_messages')
        .insert({
          session_id: sessionId,
          role: message.role,
          content: message.content,
          metadata: message.metadata || {},
        });

      if (error) throw error;
    } catch (error) {
      console.error('❌ [saveMessage] Erreur:', JSON.stringify(error, null, 2));
    }
  };

  // Gestion de l'envoi de message texte
  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userContent = inputText.trim();
    setInputText('');
    setIsProcessing(true);

    // 1. Ajouter message utilisateur
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userContent,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    if (sessionId) await saveMessage(sessionId, userMessage);

    try {
      // Retrieve keys from localStorage
      const savedKeys = localStorage.getItem('iasted_api_keys');
      const keys = savedKeys ? JSON.parse(savedKeys) : {};

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: messages.concat(userMessage).map(m => ({
            role: m.role,
            content: m.content
          })),
          mode: aiMode,
          model: aiMode === 'manual' ? manualModel : undefined
        },
        headers: {
          'x-openai-key': keys.openai || '',
          'x-anthropic-key': keys.anthropic || '',
          'x-gemini-key': keys.gemini || ''
        }
      });

      if (error) throw error;

      // Handle SSE stream or JSON response
      // The new chat function returns a stream. We need to handle it.
      // For simplicity in this step, we'll assume the client handles the stream or we adapt the client.
      // However, supabase.functions.invoke doesn't support streaming easily without custom fetch.
      // Let's use a custom fetch for streaming support.

      // ... actually, let's stick to the existing pattern but use the new endpoint.
      // If the endpoint returns a stream, invoke might return a ReadableStream.
      // But for now, let's assume we want to just get the text for the UI.
      // Wait, I implemented streaming in the backend.
      // So I need to handle streaming here.

      // RE-IMPLEMENTATION WITH STREAMING FETCH
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'x-openai-key': keys.openai || '',
          'x-anthropic-key': keys.anthropic || '',
          'x-gemini-key': keys.gemini || ''
        },
        body: JSON.stringify({
          messages: messages.concat(userMessage).map(m => ({
            role: m.role,
            content: m.content
          })),
          mode: aiMode,
          model: aiMode === 'manual' ? manualModel : undefined
        })
      });

      if (!response.ok) throw new Error(await response.text());

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantMsgId = crypto.randomUUID();

      // Create placeholder message
      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
      }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') break;

            try {
              const data = JSON.parse(dataStr);
              const text = data.choices?.[0]?.delta?.content || '';
              assistantContent += text;

              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId ? { ...m, content: assistantContent } : m
              ));
            } catch (e) {
              console.error('Error parsing SSE:', e);
            }
          }
        }
      }

      if (sessionId) await saveMessage(sessionId, {
        id: assistantMsgId,
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erreur chat:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clean up voice connections on unmount
  useEffect(() => {
    return () => {
      if (openaiRTC.isConnected) {
        openaiRTC.disconnect();
      }
    };
  }, [openaiRTC.isConnected]);

  const handleConnect = async () => {
    if (openaiRTC.isConnected) {
      openaiRTC.disconnect();
    } else {
      await openaiRTC.connect(selectedVoice, systemPrompt);
    }
  };

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="neu-card w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="neu-card p-6 rounded-t-2xl rounded-b-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="neu-raised w-14 h-14 rounded-full flex items-center justify-center p-3">
                <Brain className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">iAsted - Chat Stratégique</h2>
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={aiMode}
                    onChange={(e) => setAiMode(e.target.value as any)}
                    className="text-xs bg-background/50 border border-border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="auto-power">🚀 Auto Power (Max Perf)</option>
                    <option value="auto-cost">💰 Auto Cost (Éco)</option>
                    <option value="manual">⚙️ Manuel</option>
                  </select>

                  {aiMode === 'manual' && (
                    <select
                      value={manualModel}
                      onChange={(e) => setManualModel(e.target.value)}
                      className="text-xs bg-background/50 border border-border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="gpt-4o">OpenAI GPT-4o</option>
                      <option value="gpt-4o-mini">OpenAI GPT-4o Mini</option>
                      <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</option>
                      <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Boutons de gestion de conversation */}
              <button
                onClick={handleNewConversation}
                className="neu-button-sm flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/10 transition-colors"
                title="Nouvelle conversation"
              > <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Nouvelle</span>
              </button>

              <button
                onClick={handleClearConversation}
                className="neu-button-sm flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors"
                title="Supprimer tout l'historique"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Voice Selector */}
              <div className="flex items-center gap-2 bg-background/50 rounded-lg p-1 border border-border/50">
                <button
                  onClick={async () => {
                    setSelectedVoice('ash');
                    localStorage.setItem('iasted-voice-selection', 'ash');
                    if (openaiRTC.isConnected) {
                      await openaiRTC.disconnect();
                      await openaiRTC.connect('ash');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${selectedVoice === 'ash'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/80'
                    }`}
                >
                  Homme
                </button>
                <button
                  onClick={async () => {
                    setSelectedVoice('shimmer');
                    localStorage.setItem('iasted-voice-selection', 'shimmer');
                    if (openaiRTC.isConnected) {
                      await openaiRTC.disconnect();
                      await openaiRTC.connect('shimmer');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${selectedVoice === 'shimmer'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/80'
                    }`}
                >
                  Femme
                </button>
              </div>

              <button
                onClick={onClose}
                className="neu-raised p-2 rounded-lg hover:shadow-neo-md transition-all"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
        </div >

        {/* Messages */}
        < div className="flex-1 overflow-y-auto p-4 space-y-2" >
          <AnimatePresence>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onDelete={handleDeleteMessage}
                onEdit={handleEditMessage}
                onCopy={handleCopyMessage}
              />
            ))}
          </AnimatePresence>

          {
            isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">iAsted réfléchit...</span>
              </motion.div>
            )
          }

          <div ref={messagesEndRef} />
        </div >

        {/* Input Area */}
        < div className="p-4 border-t border-border bg-background/50 backdrop-blur-md flex items-end gap-2" >
          <button
            onClick={() => openaiRTC.toggleConversation(selectedVoice)}
            className={`neu-raised p-4 rounded-xl hover:shadow-neo-lg transition-all ${openaiRTC.isConnected ? 'bg-primary text-primary-foreground' : ''
              }`}
            title={openaiRTC.isConnected ? 'Arrêter le mode vocal' : 'Activer le mode vocal'}
          >
            {openaiRTC.isConnected ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6 text-primary" />
            )}
          </button>

          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                openaiRTC.isConnected ? `🎙️ Mode vocal actif (${selectedVoice === 'echo' ? 'Standard' : 'Africain'})` :
                  "Posez votre question à iAsted..."
              }
              className="w-full neu-inset rounded-xl p-4 pr-12 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px] max-h-[120px]"
              rows={1}
              disabled={isProcessing || openaiRTC.isConnected}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isProcessing || openaiRTC.isConnected}
              className="absolute right-2 bottom-2 p-2 rounded-lg hover:bg-primary/10 text-primary disabled:opacity-50 transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div >
        <div className="text-center text-sm text-muted-foreground mt-3">
          {isProcessing ? '🧠 iAsted analyse...' :
            openaiRTC.isConnected ? `🎙️ Mode vocal actif (${selectedVoice === 'echo' ? 'Standard' : 'Africain'})` :
              '💬 Conversation stratégique'}
        </div>
      </motion.div >
    </div >
  );
};
