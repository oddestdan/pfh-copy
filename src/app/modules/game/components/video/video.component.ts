import {
  Component, ViewChild, Input, ElementRef, OnInit
} from '@angular/core';
import { IWSPeer } from '../../interfaces/iwspeer';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss'],
})

export class VideoComponent implements OnInit {
  @Input() peer: IWSPeer;
  @ViewChild('videoPlayer') videoPlayer: ElementRef;

  ngOnInit(): void {
    this.peer.data.on('stream', (stream: MediaStream) => {
      this.videoPlayer.nativeElement.srcObject = stream;
    });
  }
}
