import { Component, inject, OnInit } from '@angular/core';
import { PollService } from "../poll-service";
import { toSignal } from "@angular/core/rxjs-interop";
import { Survey } from "../../model/survey";
import { Router, RouterLink } from "@angular/router";

@Component({
  selector: 'app-poll-list',
  imports: [RouterLink],
  templateUrl: './poll-list.html',
  styleUrl: './poll-list.css',
})
export class PollList implements OnInit {
  private readonly pollService = inject(PollService);
  private readonly router = inject(Router);
  protected readonly pollList = toSignal<Survey[]>(this.pollService.getAll());

  ngOnInit(): void {

  }

  createNew() {
    this.router.navigate(['/admin/polls/new']);
  }
}
