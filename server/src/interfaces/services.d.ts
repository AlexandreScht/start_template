export namespace Services {
  namespace Users {
    type findOne = { email: string; isoAuth?: boolean } | { id: number };
  }
}
