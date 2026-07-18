import { trigger, style, animate, transition, keyframes, state } from '@angular/animations';

export const bellRingAnimation = trigger('bellRing', [
  transition('* => ring', [
    animate(
      '0.6s ease',
      keyframes([
        style({ transform: 'rotate(0deg)', offset: 0 }),
        style({ transform: 'rotate(15deg)', offset: 0.2 }),
        style({ transform: 'rotate(-15deg)', offset: 0.4 }),
        style({ transform: 'rotate(10deg)', offset: 0.6 }),
        style({ transform: 'rotate(-10deg)', offset: 0.8 }),
        style({ transform: 'rotate(0deg)', offset: 1 }),
      ])
    ),
  ]),
]);

export const drawerAnimation = trigger('drawerSlide', [
  transition(':enter', [
    style({ transform: 'translateX(100%)', opacity: 0 }),
    animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(0)', opacity: 1 })),
  ]),
  transition(':leave', [
    animate('250ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(100%)', opacity: 0 })),
  ]),
]);

export const toastAnimation = trigger('toastSlide', [
  transition(':enter', [
    style({ transform: 'translateX(100%)', opacity: 0 }),
    animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(0)', opacity: 1 })),
  ]),
  transition(':leave', [
    animate('250ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(110%)', opacity: 0 })),
  ]),
]);

export const listItemAnimation = trigger('listItem', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-10px)' }),
    animate('250ms ease', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate('200ms ease', style({ opacity: 0, transform: 'translateX(-20px)', height: 0, padding: 0 })),
  ]),
]);

export const badgePulse = trigger('badgePulse', [
  transition('* => pulse', [
    animate(
      '0.4s ease',
      keyframes([
        style({ transform: 'scale(1)', offset: 0 }),
        style({ transform: 'scale(1.4)', offset: 0.5 }),
        style({ transform: 'scale(1)', offset: 1 }),
      ])
    ),
  ]),
]);

export const overlayAnimation = trigger('overlay', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('200ms ease', style({ opacity: 1 })),
  ]),
  transition(':leave', [
    animate('200ms ease', style({ opacity: 0 })),
  ]),
]);
