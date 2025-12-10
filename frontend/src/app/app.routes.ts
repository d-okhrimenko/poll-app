import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { adminGuard } from "./auth/auth.guards";
import { PollList } from "./admin/poll-list/poll-list";
import { PollEdit } from "./admin/poll-edit/poll-edit";
import { PollDetails } from "./admin/poll-details/poll-details";

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  {
    path: 'admin', canActivate: [adminGuard],
    children: [
      { path: "", pathMatch: "full", redirectTo: "polls" },
      { path: 'polls', component: PollList },
      { path: 'polls/new', component: PollEdit },
      { path: 'polls/:id', component: PollDetails },
      { path: 'polls/edit/:id', component: PollEdit },
    ]
  },

  { path: '**', redirectTo: '' }
];
