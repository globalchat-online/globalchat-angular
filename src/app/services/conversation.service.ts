import { Injectable, EventEmitter } from '@angular/core';
import { Conversation } from '../models/conversation.model';
import { User } from '../models/user.model';
import { Message } from '../models/message.model';
import { BehaviorSubject } from 'rxjs';
import { ChatService } from './chat.service';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {

  private _conversationList: Array<Conversation> = new Array();
  private _currentConversation: Conversation;

  private _conversationListChanged = new BehaviorSubject<Array<Conversation>>(this._conversationList);
  private _conversationChanged = new BehaviorSubject<Conversation>(this._currentConversation);
  public conversationChanged$ = this._conversationChanged.asObservable();
  public conversationListChanged$ = this._conversationListChanged.asObservable();

  constructor(private chatService: ChatService) {
    this._currentConversation = this._conversationList[0];
    this._conversationChanged.next(this._currentConversation);

    this.chatService.onMessage().subscribe(message => {
      // this._currentConversation.pushHistory(message);
      for (let c of this._conversationList) {
        if (c.user.email === message.from.email) {
          c.pushHistory(message);
          break;
        }
      }
      this._conversationListChanged.next(this._conversationList);
    });

    this.chatService.onNewUserLoggedIn().subscribe(user => {
      let found = this._conversationList.some(c => {
        return c.user.email == user.email;
      })
      // or
      // let found = this._conversationList.map(c => c.user.email).indexOf(user.email) >= 0;
      if (found) return;
      let conversation = new Conversation(user);
      console.log(`then create a new conversation: ${conversation}`);
      this._conversationList.push(conversation);
    });

    this.chatService.getOnlineUsers().subscribe(users => {
      for (let user of users) {
        this._conversationList.push(new Conversation(user));
      }
    });
  }

  public switchConversation(c: Conversation) {
    this._currentConversation = c;
    this._conversationChanged.next(c);
  }

  public get conversationList(): Array<Conversation> {
    return this._conversationList;
  }

  public addNewConversation(c: Conversation) {
    this._conversationList.push(c);
  }

  public removeConversation(c: Conversation) {
    for (let key in this._conversationList) {
      if (this._conversationList[key].user.email == c.user.email) {
        delete this._conversationList[key];
      }
    }
  }

  public say(message: Message) {
    this.chatService.send(message);
    this._currentConversation.pushHistory(message);
  }

  public getConversationHistory(): Array<Message> {
    return this._currentConversation.history;
  }

  public saveConversationDraft(draft: string) {
    this._currentConversation.draft = draft;
  }

  public getConversationDraft(): string {
    return this._currentConversation.draft;
  }

}
