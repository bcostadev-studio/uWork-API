export abstract class BaseAdapter<T> {
  /**
   * Converts a third-party object to the application type T.
   * Validates input before mapping.
   */
  public toApplicationResponse(thirdParty: unknown): T {
    if (thirdParty === null || thirdParty === undefined) {
      throw new Error(
        `[${this.constructor.name}] Input cannot be null or undefined.`,
      );
    }

    if (!this.validate(thirdParty)) {
      throw new Error(
        `[${this.constructor.name}] Validation failed for input: ${JSON.stringify(thirdParty)}`,
      );
    }

    return this.map(thirdParty);
  }

  /**
   * Converts an array of third-party objects to an array of T.
   */
  public toApplicationResponseList(thirdPartyList: unknown[]): T[] {
    if (!Array.isArray(thirdPartyList)) {
      throw new Error(
        `[${this.constructor.name}] Expected an array but received: ${typeof thirdPartyList}`,
      );
    }

    return thirdPartyList.map((item, index) => {
      try {
        return this.toApplicationResponse(item);
      } catch (error) {
        throw new Error(
          `[${this.constructor.name}] Failed to convert item at index ${index}: ${(error as Error).message}`,
        );
      }
    });
  }

  /**
   * Converts an application type T back to the third-party representation.
   */
  public abstract toThirdParty(application: T): unknown;

  /**
   * Validates the raw third-party input before mapping.
   * Override to add custom validation logic.
   */
  public abstract validate(thirdParty: unknown): boolean;

  /**
   * Core mapping logic to be implemented by each concrete adapter.
   */
  public abstract map(thirdParty: unknown): T;
}
