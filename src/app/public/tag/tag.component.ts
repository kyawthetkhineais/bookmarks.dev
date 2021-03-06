import { Component, OnInit } from '@angular/core';
import { TagService } from './tag.service';
import { ActivatedRoute } from '@angular/router';
import { Bookmark } from '../../core/model/bookmark';
import { Observable } from 'rxjs';
import { UserDataStore } from '../../core/user/userdata.store';
import { KeycloakService } from 'keycloak-angular';
import { UserData } from '../../core/model/user-data';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { LoginRequiredDialogComponent } from '../../shared/login-required-dialog/login-required-dialog.component';

@Component({
  selector: 'app-tag',
  templateUrl: './tag.component.html',
  styleUrls: ['./tag.component.css']
})
export class TagComponent implements OnInit {

  bookmarksForTag$: Observable<Bookmark[]>;
  tag: string;
  userData: UserData;
  counter = 30;
  orderBy = 'LATEST'; // TODO move to enum orderBy values
  userIsLoggedIn = false;

  // default is oder by latest/newest

  constructor(private tagService: TagService,
              private userDataStore: UserDataStore,
              private keycloakService: KeycloakService,
              private route: ActivatedRoute,
              private loginDialog: MatDialog) {
  }

  ngOnInit() {
    this.tag = this.route.snapshot.params['tag'];
    this.route.paramMap.subscribe(
      params => {
        this.tag = params.get('tag');
        if (this.tag) {
          this.bookmarksForTag$ = this.tagService.getBookmarksForTag(this.tag, this.orderBy);
        } else {
          this.tag = this.route.snapshot.url[0].path;
          this.bookmarksForTag$ = this.tagService.getBookmarksForTag(this.tag, this.orderBy);
        }
      });


    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.keycloakService.loadUserProfile().then(keycloakProfile => {
          this.userDataStore.getUserData().subscribe(data => {
              this.userData = data;
            },
            error => {
            }
          );
        });
      }
    });
  }

  showMoreResults() {
    this.counter += 10;
  }

  getLatestForTag() {
    this.orderBy = 'LATEST';
    this.bookmarksForTag$ = this.tagService.getBookmarksForTag(this.tag, this.orderBy);
  }

  getByStars() {
    this.orderBy = 'STARS';
    this.bookmarksForTag$ = this.tagService.getBookmarksForTag(this.tag, this.orderBy);
  }

  watchTag() {
    if (!this.userIsLoggedIn) {
        const dialogConfig = new MatDialogConfig();

        dialogConfig.disableClose = true;
        dialogConfig.autoFocus = true;
        dialogConfig.data = {
          message: 'You need to be logged in to follow tags'
        };

        this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      this.userData.watchedTags.push(this.tag);
      this.userDataStore.updateUserData(this.userData).subscribe(() => {
        this.userDataStore.forceReloadBookmarksForWatchedTags();
      });

    }
  }

  unwatchTag() {
    const index = this.userData.watchedTags.indexOf(this.tag);
    if (index > -1) {
      this.userData.watchedTags.splice(index, 1);
      this.userDataStore.updateUserData(this.userData).subscribe( () => {
        this.userDataStore.forceReloadBookmarksForWatchedTags();
      });
    }
  }

}
