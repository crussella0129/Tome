// The search UI's invitational copy, honest about the library it searches. With
// several tomes it reads library-wide; with a single tome it must not imply there
// are more ("Search this tome"). Pure so it can be unit-tested without the island.

export interface SearchScopeCopy {
  /** The trigger button label. */
  readonly trigger: string;
  /** The empty-query hint inside the dialog. */
  readonly hint: string;
  /** The dialog's accessible name. */
  readonly dialogLabel: string;
}

/**
 * @param libraryWide `true` when the library holds more than one tome.
 */
export function searchScopeCopy(libraryWide: boolean): SearchScopeCopy {
  return libraryWide
    ? {
        trigger: 'Search the library',
        hint: 'Search every tome — titles, headings, and text.',
        dialogLabel: 'Search the library',
      }
    : {
        trigger: 'Search this tome',
        hint: 'Search this tome — titles, headings, and text.',
        dialogLabel: 'Search this tome',
      };
}
