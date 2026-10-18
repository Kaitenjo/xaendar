import type { FieldDecorator } from '@xaendar/types';

/**
 * Trims the string a field is initialized with.
 */
const Trim: FieldDecorator<object, string> = () => value => value.trim();

/**
 * A greeting.
 */
class Greeting {
  /**
   * The text, without the spaces around it.
   */
  @Trim
  public text = '  Hello  ';
}

/**
 * A greeting, with its text trimmed.
 */
const greeting = new Greeting();
greeting.text;           // 'Hello'
greeting.text = '  Hi '; // a later assignment is not trimmed
