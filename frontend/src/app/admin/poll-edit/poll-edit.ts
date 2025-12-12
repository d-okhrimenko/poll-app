import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { PollService } from "../poll-service";
import { Survey } from "../../model/survey";
import { UpdateSurveyRequest } from "../../model/update-survey-request";
import { CreateSurveyRequest } from "../../model/create-survey-request";
import { Observable } from "rxjs";

@Component({
  selector: 'app-poll-edit',
  imports: [ReactiveFormsModule],
  templateUrl: './poll-edit.html',
  styleUrl: './poll-edit.css',
})
export class PollEdit implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly pollService = inject(PollService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly inEditMode = signal(false);
  readonly hasError = signal<boolean | null>(null);
  readonly statusMessage = signal<string>('');
  id: string = '';

  protected readonly form = this.fb.group({
    question: this.fb.control<string>('', [Validators.required]),
    options: this.fb.array([this.createOptionGroup('', '')])
  });

  ngOnInit(): void {
    this.id = this.route.snapshot.params["id"];
    if (this.id) {
      this.pollService.getById(this.id)
        .subscribe({
          next: result => this.patchForm(result),
          error: response => {
            if (response.error.status = 404) this.showErrorMessage('Опитування не знайдено');
            else this.showErrorMessage(response.error.message);
          }
        });
      this.inEditMode.set(true);
    }
  }

  patchForm(value: Survey) {
    this.form.patchValue(value);

    const options = this.form.controls.options;
    options.clear();

    value.options.forEach(option =>
      options.push(this.createOptionGroup(option.id, option.text)));
  }

  removeOption(index: number) {
    this.form.controls.options.removeAt(index);
  }

  addOption() {
    this.form.controls.options.push(this.createOptionGroup('', ''));
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.controls.options.length < 2) {
      this.showErrorMessage('Опитування повинно мати мінімум два варіанта відповіді');
      return;
    }

    const request$: Observable<unknown> = this.inEditMode()
      ? this.pollService.update(this.id, this.getUpdateSurveyRequest())
      : this.pollService.create(this.getCreateSurveyRequest());

    request$.subscribe({
      next: () => this.showMessage('Дані успішно збережені'),
      error: (err) => this.showErrorMessage(err?.error?.message ?? 'Сталася помилка')
    });
  }

  cancel() {
    this.router.navigate(['/admin/polls']);
  }

  private createOptionGroup(id: string, text: string) {
    return this.fb.group({
      id: this.fb.control(id),
      text: this.fb.control(text, [Validators.required, Validators.minLength(3)])
    });
  }

  private getUpdateSurveyRequest(): UpdateSurveyRequest {
    const raw = this.form.getRawValue();

    return {
      question: raw.question ?? '',
      options: raw.options.map(o => ({
        id: o.id ?? undefined,
        text: o.text ?? ''
      }))
    };
  }

  private getCreateSurveyRequest(): CreateSurveyRequest {
    const raw = this.form.getRawValue();

    return {
      question: raw.question ?? '',
      options: raw.options.map(o => o.text ?? '')
    };
  }

  private showErrorMessage(message: string) {
    this.hasError.set(true);
    this.statusMessage.set(message);
  }

  private showMessage(message: string) {
    this.hasError.set(false);
    this.statusMessage.set(message);
  }
}
