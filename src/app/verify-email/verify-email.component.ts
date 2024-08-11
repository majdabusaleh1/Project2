import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-verify-email",
  templateUrl: "./verify-email.component.html",
})
export class VerifyEmailComponent implements OnInit {
  message =
    "Please verify your email address. Check your inbox for the verification email.";

  ngOnInit(): void {
    console.log("VerifyEmailComponent initialized");
  }
}
