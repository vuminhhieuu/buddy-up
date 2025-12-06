/**
 * Group Rules Service
 * Functions for managing group rules
 */

import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';
import type { AddGroupRuleResponse, DeleteGroupRuleResponse, GroupRule } from './types';

/**
 * Add a rule to a group
 */
export async function addGroupRule(
  groupId: string,
  ruleText: string,
): Promise<AddGroupRuleResponse> {
  try {
    // Get current max order_index
    const { data: existingRules, error: fetchError } = await supabase
      .from('group_rules')
      .select('order_index')
      .eq('group_id', groupId)
      .order('order_index', { ascending: false })
      .limit(1);

    if (fetchError) {
      logger.error('addGroupRule.fetch', fetchError.message, fetchError);
      return {
        success: false,
        error: fetchError.message,
        errorCode: 'NETWORK_ERROR',
      };
    }

    const nextOrderIndex =
      existingRules && existingRules.length > 0 ? existingRules[0].order_index + 1 : 0;

    // Check if max rules reached (10 rules max)
    if (existingRules && existingRules.length >= 10) {
      return {
        success: false,
        error: 'Maximum 10 rules allowed per group',
        errorCode: 'MAX_RULES_REACHED',
      };
    }

    const { data, error } = await supabase
      .from('group_rules')
      .insert({
        group_id: groupId,
        rule_text: ruleText,
        order_index: nextOrderIndex,
      })
      .select('*')
      .single();

    if (error) {
      logger.error('addGroupRule', error.message, error);
      return {
        success: false,
        error: error.message,
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: true,
      rule: data as GroupRule,
    };
  } catch (err: any) {
    logger.error('addGroupRule', 'Unexpected error', err);
    return {
      success: false,
      error: err.message || 'Failed to add rule',
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * Delete a rule from a group
 */
export async function deleteGroupRule(
  groupId: string,
  ruleId: string,
): Promise<DeleteGroupRuleResponse> {
  try {
    // Check if this is the first rule (order_index = 0)
    const { data: rule, error: fetchError } = await supabase
      .from('group_rules')
      .select('order_index')
      .eq('id', ruleId)
      .eq('group_id', groupId)
      .single();

    if (fetchError) {
      logger.error('deleteGroupRule.fetch', fetchError.message, fetchError);
      return {
        success: false,
        error: fetchError.message,
        errorCode: 'NETWORK_ERROR',
      };
    }

    if (rule && rule.order_index === 0) {
      return {
        success: false,
        error: 'Cannot delete the first rule',
        errorCode: 'CANNOT_DELETE_FIRST',
      };
    }

    const { error } = await supabase.from('group_rules').delete().eq('id', ruleId);

    if (error) {
      logger.error('deleteGroupRule', error.message, error);
      return {
        success: false,
        error: error.message,
        errorCode: 'NETWORK_ERROR',
      };
    }

    // Reorder remaining rules
    const { data: remainingRules, error: reorderError } = await supabase
      .from('group_rules')
      .select('*')
      .eq('group_id', groupId)
      .order('order_index', { ascending: true });

    if (reorderError) {
      logger.warn('deleteGroupRule.reorder', reorderError.message, reorderError);
      // Continue even if reordering fails
    } else if (remainingRules && remainingRules.length > 0) {
      // Batch update order_index for remaining rules using upsert
      const updates = remainingRules.map((r, index) => ({
        id: r.id,
        group_id: r.group_id,
        rule_text: r.rule_text,
        order_index: index,
        created_at: r.created_at,
      }));

      const { error: upsertError } = await supabase
        .from('group_rules')
        .upsert(updates, { onConflict: 'id' });

      if (upsertError) {
        logger.warn('deleteGroupRule.upsert', upsertError.message, upsertError);
        // Continue even if reordering fails
      }
    }

    return {
      success: true,
    };
  } catch (err: any) {
    logger.error('deleteGroupRule', 'Unexpected error', err);
    return {
      success: false,
      error: err.message || 'Failed to delete rule',
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * Get all rules for a group
 */
export async function getGroupRules(groupId: string): Promise<GroupRule[]> {
  try {
    const { data, error } = await supabase
      .from('group_rules')
      .select('*')
      .eq('group_id', groupId)
      .order('order_index', { ascending: true });

    if (error) {
      logger.error('getGroupRules', error.message, error);
      return [];
    }

    return (data as GroupRule[]) || [];
  } catch (err: any) {
    logger.error('getGroupRules', 'Unexpected error', err);
    return [];
  }
}

/**
 * Update rule order
 */
export async function updateGroupRulesOrder(
  groupId: string,
  ruleIds: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch all rules that need to be updated
    const { data: rules, error: fetchError } = await supabase
      .from('group_rules')
      .select('*')
      .eq('group_id', groupId)
      .in('id', ruleIds);

    if (fetchError) {
      logger.error('updateGroupRulesOrder.fetch', fetchError.message, fetchError);
      return {
        success: false,
        error: fetchError.message,
      };
    }

    if (!rules || rules.length !== ruleIds.length) {
      return {
        success: false,
        error: 'Some rules not found',
      };
    }

    // Create a map of rule ID to rule data for quick lookup
    const ruleMap = new Map(rules.map((r) => [r.id, r]));

    // Batch update order_index for all rules using upsert
    const updates = ruleIds.map((ruleId, index) => {
      const rule = ruleMap.get(ruleId);
      if (!rule) {
        throw new Error(`Rule ${ruleId} not found`);
      }
      return {
        id: rule.id,
        group_id: rule.group_id,
        rule_text: rule.rule_text,
        order_index: index,
        created_at: rule.created_at,
      };
    });

    const { error: upsertError } = await supabase
      .from('group_rules')
      .upsert(updates, { onConflict: 'id' });

    if (upsertError) {
      logger.error('updateGroupRulesOrder.upsert', upsertError.message, upsertError);
      return {
        success: false,
        error: upsertError.message,
      };
    }

    return { success: true };
  } catch (err: any) {
    logger.error('updateGroupRulesOrder', 'Unexpected error', err);
    return {
      success: false,
      error: err.message || 'Failed to update rules order',
    };
  }
}
