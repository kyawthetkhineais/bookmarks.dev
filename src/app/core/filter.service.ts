import {Injectable} from '@angular/core';
import {Bookmark} from './model/bookmark';
import {List} from 'immutable';
import {Observable} from 'rxjs';

@Injectable()
export class BookmarkFilterService {

  /**
   * Filters a list of bookmarks based on the query string.
   *
   * Tags are enclosed in square brackets - e.g [angular]. The filter is now permissive, that is when starting with
   * "[" the filter assumes that the tag is what comes after even though there is no enclosing "]". That is now to support
   * the autosearch feature
   *
   * @param query - is a string of search terms; multiple terms are separated via the "+" sign
   * @param bookmarks$ - the list to be filtered
   * @returns {any} - the filtered list
   */
  /*filterBookmarks$BySearchTerm(query: string, language: string, bookmarks$: Observable<any>): Bookmark[] {

    const searchedTermsAndTags: [string[], string[]] = this.splitSearchQuery(query);
    const searchedTerms: string[] = searchedTermsAndTags[0];
    const searchedTags: string[] = searchedTermsAndTags[1];
    let result: Bookmark[] = [];

    bookmarks$.subscribe(

      bookmarks => {
        let filteredBookmarks;
        if (bookmarks instanceof List) {
          filteredBookmarks = bookmarks.toArray(); // we start with all bookmarks
        } else {
          filteredBookmarks = bookmarks;
        }

        if (language && language !== 'all') {
          filteredBookmarks = filteredBookmarks.filter(x => x.language === language);
        }
        searchedTags.forEach(tag => {
          filteredBookmarks = filteredBookmarks.filter(x => this.bookmarkContainsTag(x, tag));
        });
        searchedTerms.forEach(term => {
          filteredBookmarks = filteredBookmarks.filter(x => this.bookmarkContainsSearchedTerm(x, term.trim()));
        });

        result = filteredBookmarks;
      },
      err => {
        console.log('Error filtering bookmakrs');
      }
    );

    return result;
  }
*/

  /**
   * It will parse the search query and returns the search terms and tags to filter.
   * It is permissive, in the sense that "[angul" is seen as the "angul" tag - needed for autocomplete
   * To see what should come out check the filter.service.spec.ts test examples
   *
   * @param query to be parsed
   * @returns a tuple of terms (first element) and tags (second element)
   */
  public splitSearchQuery(query: string): [string[], string[]] {

    const result: [string[], string[]] = [[], []];

    const terms: string[] = [];
    let term = '';
    const tags: string[] = [];
    let tag = '';

    let isInsideTerm = false;
    let isInsideTag = false;


    for (let i = 0; i < query.length; i++) {
      const currentCharacter = query[i];
      if (currentCharacter === ' ') {
        if (!isInsideTag) {
          if (!isInsideTerm) {
            continue;
          } else {
            terms.push(term);
            isInsideTerm = false;
            term = '';
          }
        } else {
          tag += ' ';
        }
      } else if (currentCharacter === '[') {
        if (isInsideTag) {
          tags.push(tag.trim());
          tag = '';
        } else {
          isInsideTag = true;
        }
      } else if (currentCharacter === ']') {
        if (isInsideTag) {
          isInsideTag = false;
          tags.push(tag.trim());
          tag = '';
        }
      } else {
        if (isInsideTag) {
          tag += currentCharacter;
        } else {
          isInsideTerm = true;
          term += currentCharacter;
        }
      }
    }

    if (tag.length > 0) {
      tags.push(tag.trim());
    }

    if (term.length > 0) {
      terms.push(term);
    }

    result[0] = terms;
    result[1] = tags;

    return result;
  }

  /**
   * Checks if one search term is present in the bookmark's metadata (name, location, description, tags)
   * There is still an internal debate to use the contains(includes) vs word boundary or characters boundary (current)
   * See if there are performance issues
   *
   * @param bookmark
   * @param searchedTerm
   * @returns {boolean}
   */
  private bookmarkContainsSearchedTerm(bookmark: Bookmark, searchedTerm: string): boolean {
    let result = false;
    // const escapedSearchPattern = '\\b' + this.escapeRegExp(searchedTerm.toLowerCase()) + '\\b'; word boundary was not enough, especially for special characters which can happen in coding
    // https://stackoverflow.com/questions/23458872/javascript-regex-word-boundary-b-issue
    const separatingChars = '\\s\\.,;#\\-\\/_\\[\\]\\(\\)\\*\\+';
    const escapedSearchPattern = `(^|[${separatingChars}])(${this.escapeRegExp(searchedTerm.toLowerCase())})(?=$|[${separatingChars}])`;
    const pattern = new RegExp(escapedSearchPattern);
    if ((bookmark.name && pattern.test(bookmark.name.toLowerCase()))
      || (bookmark.location && pattern.test(bookmark.location.toLowerCase()))
      || (bookmark.description && pattern.test(bookmark.description.toLowerCase()))
    ) {
      result = true;
    }

    if (result) {
      return true;
    } else {
      // if not found already look through the tags also
      bookmark.tags.forEach(tag => {
        if (pattern.test(tag.toLowerCase())) {
          result = true;
        }
      });
    }

    return result;
  }

  /**
   * It must be an exact match
   * @param bookmark
   * @param tag
   */
  private bookmarkContainsTag(bookmark: Bookmark, tag: string): boolean {
    let result = false;

    const escapedString = this.escapeRegExp(tag.toLowerCase());
    bookmark.tags.forEach(bookmarkTag => {
      if (bookmarkTag.toLowerCase() === tag.toLowerCase()) {
        result = true;
      }
    });

    return result;
  }

  // TODO considering how often these characters might get used in search maybe is not important to escape them after all
  private escapeRegExp(str): string {
    const specials = [
        // order matters for these
        '-'
        , '['
        , ']'
        // order doesn't matter for any of these
        , '/'
        , '{'
        , '}'
        , '('
        , ')'
        , '*'
        , '+'
        , '?'
        , '.'
        , '\\'
        , '^'
        , '$'
        , '|'
      ],
      regex = RegExp('[' + specials.join('\\') + ']', 'g');
    return str.replace(regex, '\\$&'); // $& means the whole matched string
  }
}
