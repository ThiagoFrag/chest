import { describe, it, expect } from 'vitest';
import { summarizeAdvancements, prettyAdvancementName, summarizeStats } from './advancements';

describe('prettyAdvancementName', () => {
	it('humanizes a nested id', () => {
		expect(prettyAdvancementName('minecraft:nether/all_potions')).toBe('All Potions');
	});
	it('handles single-word leaf', () => {
		expect(prettyAdvancementName('minecraft:story/root')).toBe('Root');
	});
	it('drops the prefix and earlier path segments', () => {
		expect(prettyAdvancementName('minecraft:husbandry/breed_all_animals')).toBe('Breed All Animals');
	});
});

describe('summarizeAdvancements', () => {
	const raw = {
		'minecraft:story/root': { done: true, criteria: { in_overworld: '2026-01-01 10:00:00 +0000' } },
		'minecraft:story/mine_stone': {
			done: true,
			criteria: { get_stone: '2026-01-02 12:00:00 +0000' }
		},
		'minecraft:story/upgrade_tools': { done: false, criteria: {} },
		'minecraft:nether/root': { done: true, criteria: { entered_nether: '2026-01-03 09:30:00 +0000' } },
		'minecraft:end/root': { done: false, criteria: {} },
		'minecraft:recipes/misc/charcoal': { done: true, criteria: { has_log: '2026-01-04 08:00:00 +0000' } },
		DataVersion: 3700
	};

	it('groups by tree and counts done vs total ignoring recipes', () => {
		const result = summarizeAdvancements(raw);
		const story = result.trees.find((t) => t.tree === 'story');
		const nether = result.trees.find((t) => t.tree === 'nether');
		const end = result.trees.find((t) => t.tree === 'end');

		expect(story).toEqual({ tree: 'story', done: 2, total: 3 });
		expect(nether).toEqual({ tree: 'nether', done: 1, total: 1 });
		expect(end).toEqual({ tree: 'end', done: 0, total: 1 });
	});

	it('omits trees with no advancements and excludes recipes/DataVersion from totals', () => {
		const result = summarizeAdvancements(raw);
		expect(result.trees.some((t) => t.tree === 'adventure')).toBe(false);
		expect(result.totalDone).toBe(3);
		expect(result.totalAll).toBe(5);
	});

	it('returns recent done advancements sorted by latest criteria date', () => {
		const result = summarizeAdvancements(raw, 2);
		expect(result.recent).toHaveLength(2);
		expect(result.recent[0].id).toBe('minecraft:nether/root');
		expect(result.recent[0].name).toBe('Root');
		expect(result.recent[0].tree).toBe('nether');
		expect(result.recent[1].id).toBe('minecraft:story/mine_stone');
	});
});

describe('summarizeStats', () => {
	it('converts play_time ticks to hours (72000 ticks = 1h)', () => {
		const raw = {
			stats: {
				'minecraft:custom': {
					'minecraft:play_time': 72000,
					'minecraft:deaths': 3,
					'minecraft:mob_kills': 42,
					'minecraft:player_kills': 1,
					'minecraft:jump': 1000,
					'minecraft:damage_dealt': 500,
					'minecraft:walk_one_cm': 100000
				}
			}
		};
		const result = summarizeStats(raw);
		expect(result.playTimeHours).toBe(1);
		expect(result.deaths).toBe(3);
		expect(result.mobKills).toBe(42);
		expect(result.playerKills).toBe(1);
		expect(result.jumps).toBe(1000);
		expect(result.damageDealt).toBe(500);
		expect(result.walkDistanceKm).toBe(1);
	});

	it('falls back to legacy playOneMinute and is robust to missing keys', () => {
		const raw = {
			stats: {
				'minecraft:custom': {
					'minecraft:playOneMinute': 144000
				}
			}
		};
		const result = summarizeStats(raw);
		expect(result.playTimeHours).toBe(2);
		expect(result.deaths).toBe(0);
		expect(result.walkDistanceKm).toBe(0);
	});

	it('returns all zeros when custom block is absent', () => {
		const result = summarizeStats({});
		expect(result).toEqual({
			playTimeHours: 0,
			deaths: 0,
			mobKills: 0,
			playerKills: 0,
			jumps: 0,
			damageDealt: 0,
			walkDistanceKm: 0
		});
	});
});
