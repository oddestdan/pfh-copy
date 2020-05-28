import { Injectable } from '@angular/core';
import { IWSPeer } from '../interfaces/iwspeer';

@Injectable({
  providedIn: 'root'
})
export class PeerService {
  public peers: IWSPeer[] = [];
}
