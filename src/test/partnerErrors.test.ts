import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { translatePartnerError } from '../lib/api';

/**
 * These messages are the only thing a user sees when a partner connection fails.
 * The codes correspond to RAISE EXCEPTION calls in
 * supabase/migrations/20260725_partner_connections.sql, if that file changes,
 * this test should fail.
 */
describe('translatePartnerError', () => {
    beforeEach(() => {
        // The default branch logs; keep test output clean.
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('explains that sign-in is required', () => {
        expect(translatePartnerError({ code: '28000', message: 'Not authenticated' }))
            .toBe('You need to be signed in to connect with a partner.');
    });

    it('reports an unknown invite code without leaking whether the account exists', () => {
        const msg = translatePartnerError({ code: 'P0002', message: 'No one found with that invite code' });
        expect(msg).toBe('No one found with that invite code.');
    });

    it('distinguishes self-invite from a malformed code', () => {
        expect(translatePartnerError({ code: '22023', message: 'That is your own invite code' }))
            .toBe('That is your own invite code.');
        expect(translatePartnerError({ code: '22023', message: 'Invite code required' }))
            .toBe('That invite code does not look right.');
    });

    it('stays vague on blocked connections rather than confirming a block', () => {
        expect(translatePartnerError({ code: '42501', message: 'This connection is unavailable' }))
            .toBe('This connection is unavailable.');
    });

    it('handles the duplicate-pair unique index violation', () => {
        expect(translatePartnerError({ code: '23505', message: 'duplicate key value' }))
            .toBe('You are already connected with this person.');
    });

    it('says so plainly when the migration has not been applied', () => {
        // Verified against a live Supabase project with the migration unapplied:
        // supabase-js surfaces PostgREST's PGRST202 ("could not find the function
        // ... in the schema cache"), NOT Postgres's own 42883. Both are mapped so
        // the message is right whichever layer reports it.
        const expected = 'Partner connections are not set up on the server yet.';
        expect(translatePartnerError({ code: 'PGRST202', message: 'Could not find the function public.get_partner_summaries' })).toBe(expected);
        expect(translatePartnerError({ code: '42883', message: 'function does not exist' })).toBe(expected);
        expect(translatePartnerError({ code: 'PGRST205', message: 'Could not find the table' })).toBe(expected);
        expect(translatePartnerError({ code: '42P01', message: 'relation does not exist' })).toBe(expected);
    });

    it('falls back to the raw message when the code is unrecognized', () => {
        expect(translatePartnerError({ code: 'XX999', message: 'network unreachable' }))
            .toBe('network unreachable');
    });

    it('falls back to a generic message when there is no message at all', () => {
        expect(translatePartnerError({}))
            .toBe('Could not complete that. Check your connection and try again.');
    });
});
