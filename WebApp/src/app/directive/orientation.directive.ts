import { Directive, HostBinding, HostListener } from "@angular/core";

@Directive({
    selector: '[orientatio]'
})
export class OrientatioDirective {

    @HostBinding('class') state;

    ngOnInit() {
        this.updateOrientatioState();
    }

    @HostListener("window:resize") updateOrientatioState() {
        if (window.innerHeight > window.innerWidth) {
            this.state = 'portrait'
        } else {
            this.state = 'landscape'
        }
    }

}