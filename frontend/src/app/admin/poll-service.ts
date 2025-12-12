import { inject, Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { Survey } from "../model/survey";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { CreateSurveyRequest } from "../model/create-survey-request";
import { UpdateSurveyRequest } from "../model/update-survey-request";

@Injectable({
  providedIn: 'root',
})
export class PollService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Survey[]> {
    return this.http.get<Survey[]>(`${environment.apiBaseUrl}/surveys`);
  }

  getById(id: string): Observable<Survey> {
    return this.http.get<Survey>(`${environment.apiBaseUrl}/surveys/${id}`);
  }

  create(request: CreateSurveyRequest): Observable<Survey> {
    return this.http.post<Survey>(`${environment.apiBaseUrl}/surveys`, request);
  }

  update(id: string, request: UpdateSurveyRequest): Observable<Survey> {
    return this.http.put<Survey>(`${environment.apiBaseUrl}/surveys/${id}`, request);
  }

  delete(id: string) {
    return this.http.delete(`${environment.apiBaseUrl}/surveys/${id}`);
  }
}
