import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { single } from "rxjs";

@Component({
  selector: 'app-poll-edit',
  imports: [],
  templateUrl: './poll-edit.html',
  styleUrl: './poll-edit.css',
})
export class PollEdit implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected pollId = signal(null);

  ngOnInit(): void {
    let id = this.route.snapshot.params["id"];
    this.pollId.set(id);
  }
}
