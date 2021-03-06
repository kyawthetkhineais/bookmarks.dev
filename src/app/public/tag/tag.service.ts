import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';

import { environment } from 'environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { shareReplay } from 'rxjs/operators';

@Injectable()
export class TagService {

  private bookmarksUrl = '';  // URL to web api

  constructor(private httpClient: HttpClient) {
    this.bookmarksUrl = environment.API_URL + '/public/bookmarks/';
  }

  getBookmarksForTag(tag: string, orderBy: string): Observable<Bookmark[]> {
    const params = new HttpParams().set('orderBy', orderBy);
    return this.httpClient.get<Bookmark[]>(`${this.bookmarksUrl}tagged/${tag}`, {params: params})
      .pipe(shareReplay(1));
  };

}
