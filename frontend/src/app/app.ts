import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly auth = inject(AuthService);
  protected readonly title = signal('PollApp');

  isAuthenticated() { return this.auth.isAuthenticated(); }
  isAdmin() { return this.auth.isAdmin(); }
  userEmail() { return this.auth.currentUser()?.email ?? ''; }
  logout() { this.auth.logout(); }
}
