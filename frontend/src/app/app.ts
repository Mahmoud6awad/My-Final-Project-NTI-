import { Component, HostBinding } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { StoreService } from './core/store.service';
import { LanguageService, TranslatePipe } from './core/language';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, TranslatePipe],
  viewProviders: [StoreService],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(readonly store: StoreService, readonly language: LanguageService) {}

  @HostBinding('attr.dir')
  get direction(): string {
    return this.language.current() === 'ar' ? 'rtl' : 'ltr';
  }

  @HostBinding('attr.lang')
  get documentLanguage(): string {
    return this.language.current();
  }

  toggleLanguage(): void {
    this.language.toggle();
  }
}
