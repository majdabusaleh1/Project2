import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { VerifyEmailComponent } from "./verify-email.component";
import { VerifyEmailRoutingModule } from "./verify-email-routing.module";

@NgModule({
  declarations: [VerifyEmailComponent],
  imports: [CommonModule, VerifyEmailRoutingModule],
})
export class VerifyEmailModule {}
