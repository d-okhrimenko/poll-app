import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = new FormGroup({
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
  });

  readonly submitting = signal(false);
  readonly errorMsg = signal<string | null>(null);

  onSubmit(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.errorMsg.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.register(email, password).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => { this.errorMsg.set('Не вдалося зареєструватися'); this.submitting.set(false); },
      complete: () => { this.submitting.set(false); }
    });
  }
}
