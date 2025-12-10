import { inject, Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { Survey } from "../model/survey";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root',
})
export class PollService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Survey[]> {
    return this.http.get<Survey[]>(environment.apiBaseUrl + "/surveys");
  }
}
