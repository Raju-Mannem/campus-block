terraform {
  backend "remote" {
    organization = "campus-block"

    workspaces {
      name = "cb-workspace"
    }
  }
}
