import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService, ChatbotMessage, ChatbotResponse } from '../../services/patient.service';

@Component({
  selector: 'app-ai-chatbot',
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chatbot.html',
  styleUrl: './ai-chatbot.scss',
})
export class AiChatbot implements OnInit {
  messages: Array<{ type: 'user' | 'bot'; content: string; timestamp: Date }> = [];
  currentQuery = '';
  sending = false;
  
  suggestions = [
    'What are the symptoms of high blood pressure?',
    'How can I manage my diabetes?',
    'What should I do for a fever?',
    'Explain my recent test results'
  ];

  constructor(private patientService: PatientService) {}

  ngOnInit() {
    this.addBotMessage('Hello! I\'m your AI health assistant. How can I help you today?');
  }

  sendMessage() {
    if (!this.currentQuery.trim() || this.sending) {
      return;
    }

    const userMessage = this.currentQuery.trim();
    this.addUserMessage(userMessage);
    this.currentQuery = '';
    this.sending = true;

    const chatbotMessage: ChatbotMessage = {
      query: userMessage,
      context: {
        // Include patient context if available
        timestamp: new Date().toISOString()
      }
    };

    this.patientService.sendChatbotQuery(chatbotMessage).subscribe({
      next: (response: ChatbotResponse) => {
        this.addBotMessage(response.response);
        if (response.suggestions) {
          this.suggestions = response.suggestions;
        }
        this.sending = false;
      },
      error: (err) => {
        console.error('Error sending message:', err);
        this.addBotMessage('I apologize, but I\'m having trouble processing your request. Please try again.');
        this.sending = false;
      }
    });
  }

  addUserMessage(content: string) {
    this.messages.push({
      type: 'user',
      content,
      timestamp: new Date()
    });
    this.scrollToBottom();
  }

  addBotMessage(content: string) {
    this.messages.push({
      type: 'bot',
      content,
      timestamp: new Date()
    });
    this.scrollToBottom();
  }

  useSuggestion(suggestion: string) {
    this.currentQuery = suggestion;
    this.sendMessage();
  }

  scrollToBottom() {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }
}
