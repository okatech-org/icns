import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useAudioRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { toast } = useToast();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
      toast({
        title: "Enregistrement en cours",
        description: "Parlez maintenant...",
      });
    } catch (error) {
      console.error('Erreur accès microphone:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au microphone",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current;
      
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        reject(new Error('Pas d\'enregistrement en cours'));
        return;
      }

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Arrêter le stream
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        try {
          // Convertir en base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            // Envoyer à la fonction de transcription
            const { data, error } = await supabase.functions.invoke('transcribe-audio', {
              body: { audio: base64Audio }
            });
            
            setIsTranscribing(false);
            
            if (error) {
              console.error('Erreur transcription:', error);
              toast({
                title: "Erreur de transcription",
                description: "Impossible de transcrire l'audio",
                variant: "destructive",
              });
              reject(error);
              return;
            }
            
            if (data?.text) {
              toast({
                title: "Transcription réussie",
                description: "Envoi de votre message...",
              });
              resolve(data.text);
            } else {
              reject(new Error('Aucun texte transcrit'));
            }
          };
          
          reader.onerror = () => {
            setIsTranscribing(false);
            reject(new Error('Erreur lecture audio'));
          };
        } catch (error) {
          setIsTranscribing(false);
          console.error('Erreur transcription:', error);
          toast({
            title: "Erreur",
            description: "Échec de la transcription audio",
            variant: "destructive",
          });
          reject(error);
        }
      };

      mediaRecorder.stop();
    });
  }, [toast]);

  const cancelRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      audioChunksRef.current = [];
      
      toast({
        title: "Enregistrement annulé",
      });
    }
  }, [toast]);

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    cancelRecording,
  };
};
