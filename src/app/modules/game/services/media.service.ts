import { Injectable } from '@angular/core';

import Peer from 'simple-peer';

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private client: any = {}; // TODO: improve, organize

  public setClientGotAnswer(value: boolean): void {
    this.client.gotAnswer = value;
  }

  public getClientGotAnswer(): boolean {
    return this.client.gotAnswer;
  }

  public setClientPeer(peer: Peer): void {
    this.client.peer = peer;
  }

  public getClientPeer(): Peer {
    return this.client.peer;
  }
}
