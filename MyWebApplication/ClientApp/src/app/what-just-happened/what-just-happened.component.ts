import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-what-just-happened',
  templateUrl: './what-just-happened.component.html',
  styleUrls: ['./what-just-happened.component.css']
})
export class WhatJustHappenedComponent implements OnInit {

  @Input() viewingSessionId: string;
  @Input() filename: string;

  constructor() { }

  ngOnInit() {
  }

}
