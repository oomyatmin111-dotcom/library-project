import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AiService, ChatMessage, QuickPrompt, DialogueMatch } from '../../../core/services/ai.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.css'],
})
export class AiAssistantComponent implements OnInit {
  private aiService = inject(AiService);
  translationService = inject(TranslationService);

  isOpen = signal<boolean>(false);
  activeMode = signal<'chat' | 'dialogue'>('chat');
  inputMessage = signal<string>('');
  loading = signal<boolean>(false);
  quickPrompts = signal<QuickPrompt[]>([]);

  messages = signal<ChatMessage[]>([
    {
      sender: 'ai',
      text: 'Greetings, reader! 🦸 I am your Hero & Library AI Guide. Ask me anything about DC & Marvel comic storylines, character powers, multiverse reading orders, or physical book recommendations!',
      time: new Date(),
    },
  ]);

  dialogueQuery = signal<string>('');
  dialogueResults = signal<DialogueMatch[]>([]);
  dialogueLoading = signal<boolean>(false);

  ngOnInit() {
    this.aiService.getQuickPrompts().subscribe({
      next: (prompts) => this.quickPrompts.set(prompts),
    });
  }

  toggleOpen() {
    this.isOpen.set(!this.isOpen());
  }

  close() {
    this.isOpen.set(false);
  }

  setMode(mode: 'chat' | 'dialogue') {
    this.activeMode.set(mode);
  }

  sendMessage(textToSend?: string) {
    const text = textToSend || this.inputMessage().trim();
    if (!text || this.loading()) return;

    this.messages.update((list) => [
      ...list,
      { sender: 'user', text, time: new Date() },
    ]);
    this.inputMessage.set('');
    this.loading.set(true);

    this.aiService.chat(text).subscribe({
      next: (res) => {
        this.messages.update((list) => [
          ...list,
          { sender: 'ai', text: res.response, time: new Date() },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.messages.update((list) => [
          ...list,
          {
            sender: 'ai',
            text: 'Apologies, I encountered a temporary disturbance in the multiverse network. Please ask again!',
            time: new Date(),
          },
        ]);
        this.loading.set(false);
      },
    });
  }

  onSearchDialogue() {
    const q = this.dialogueQuery().trim();
    if (!q) return;

    this.dialogueLoading.set(true);
    this.aiService.searchDialogue(q).subscribe({
      next: (results) => {
        this.dialogueResults.set(results);
        this.dialogueLoading.set(false);
      },
      error: () => {
        this.dialogueLoading.set(false);
      },
    });
  }
}
