import { Model } from '@h3ravel/database'
import { Project } from './project'
import { Relationship } from '@h3ravel/arquebus'

export class User extends Model {
    protected table: string | null = 'users'
    protected hidden: string[] = [
        'password'
    ]

    @Relationship
    _projects () {
        return this.hasMany(Project, 'user_id')
    }
}
