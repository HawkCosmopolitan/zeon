import PubSub from 'pubsub-js';
import topics from '../../events/topics.json';
import { blogsDict, blogsDictById, postsDict, postsDictById } from '../../memory';
import { fetchCurrentRoomId } from '../../storage/auth';
import { dbDeleteBlogById, dbDeletePostById, dbDeleteSectionById, dbFetchBlogPosts, dbFetchRoomBlogs, dbFetchSections, dbFindBlogById, dbFindPostById, dbFindSectionById, dbSaveBlog, dbSavePost, dbSaveSection, dbUpdateBlog, dbUpdateBlogById, dbUpdatePost, dbUpdatePostById, dbUpdateSection, dbUpdateSectionById } from '../../storage/blog';
import { request } from '../../utils/requests';

export function createBlog(title, description, callback) {
    let pendingBlog = { title, description };
    dbSaveBlog(pendingBlog).then(({ blog, rev }) => {
        PubSub.publish(topics.BLOG_CREATION_PENDING, { blog: blog });
        request('createBlog', { title, description }, res => {
            if (res.status === 1) {
                dbUpdateBlog(blog.id, rev, res.blog);
                if (callback !== undefined) callback(res.blog);
                blogsDictById[res.blog.id] = res.blog;
                blogsDict[res.blog.roomId]?.push(res.blog);
                postsDict[res.blog.id] = [];
                PubSub.publish(topics.BLOG_CREATED, { blog: res.blog });
            }
        });
    });
}

export function createPost(title, coverId, blogId, callback) {
    let pendingPost = { title, coverId, blogId, data: [] };
    dbSavePost(pendingPost).then(({ post, rev }) => {
        PubSub.publish(topics.POST_CREATION_PENDING, { post: post });
        request('createPost', { title, coverId, blogId }, res => {
            if (res.status === 1) {
                dbUpdatePost(post.id, rev, res.post);
                if (callback !== undefined) callback(res.post);
                res.post.blog = blogsDictById[res.post.blogId];
                postsDictById[res.post.id] = res.post;
                postsDict[blogId]?.push(res.post);
                PubSub.publish(topics.POST_CREATED, { post: res.post });
            }
        });
    });
}

export function createSection(data, postId, position) {
    dbFindPostById(postId).then(post => {
        request('createSection', { data, postId, position }, res => {
            post.data.insert(position, res.section);
            dbUpdatePostById(post.id, post).then(() => {
                PubSub.publish(topics.SECTION_CREATED, { postId, section: res.section, position });
            });
        });
    });
}

export function updateBlog(blogId, title, description, callback) {
    let newBlog = blogsDictById[blogId];
    newBlog.title = title;
    newBlog.description = description;
    PubSub.publish(topics.BLOG_UPDATE_PENDING, { blog: newBlog });
    request('updateBlog', { title, description, blogId }, res => {
        if (res.status === 1) {
            dbUpdateBlogById(blogId, newBlog).then(() => {
                callback(newBlog);
                PubSub.publish(topics.BLOG_UPDATED, { blog: newBlog });
            });
        }
    });
}

export function updatePost(title, coverId, postId, callback) {
    let newPost = postsDictById[postId];
    newPost.title = title;
    newPost.coverId = coverId;
    PubSub.publish(topics.POST_UPDATE_PENDING, { post: newPost });
    request('updatePost', { title, coverId, postId }, async res => {
        if (res.status === 1) {
            await dbUpdatePostById(postId, newPost);
            if (callback) callback(newPost);
            PubSub.publish(topics.POST_UPDATED, { post: newPost });
        }
    });
}

export function updateSection(data, postId, wholeData) {
    request('updateSection', { data, postId }, res => {
        PubSub.publish(topics.SECTION_UPDATED, { postId: postId, wholeData: wholeData });
    });
}

export function deleteBlog(blogId, callback) {
    PubSub.publish(topics.BLOG_DELETE_PENDING, { blogId: blogId });
    request('deleteBlog', { blogId }, res => {
        if (res.status === 1) {
            dbDeleteBlogById(blogId).then(() => {
                callback(res);
                PubSub.publish(topics.BLOG_DELETED, { blogId: blogId });
            });
        }
    });
}

export function deletePost(postId, callback) {
    PubSub.publish(topics.POST_DELETE_PENDING, { postId: postId });
    request('deletePost', { postId }, res => {
        if (res.status === 1) {
            let post = postsDictById[postId];
            dbDeletePostById(postId).then(() => {
                postsDict[post.blogId] = postsDict[post.blogId].filter(p => p.id !== post.id);
                delete postsDictById[post.id];
                if (callback !== undefined) callback(res);
                PubSub.publish(topics.POST_DELETED, { postId: postId });
            });
        }
    });
}

export function deleteSection(postId, sectionId, callback) {
    PubSub.publish(topics.SECTION_DELETE_PENDING, { postId: postId, sectionId: sectionId });
    request('deleteSection', { postId, sectionId }, res => {
        if (res.status === 1) {
            dbDeleteSectionById(postId, sectionId).then(() => {
                if (callback !== undefined) callback(res);
                PubSub.publish(topics.SECTION_DELETED, { postId: postId, sectionId: sectionId });
            });
        }
    });
}

export function readBlogs(callback, callback2, offset, count) {
    if (callback !== undefined) {
        dbFetchRoomBlogs(fetchCurrentRoomId()).then(blogs => {
            callback(blogs);
        });
    }
    request('readBlogs', { offset, count }, res => {
        if (res.status === 1) {
            let blogs = res.blogs;
            blogs.forEach(netBlog => {
                dbUpdateBlogById(netBlog.id, netBlog);
            });
            if (callback !== undefined) callback(blogs);
            if (callback2 !== undefined) callback2(blogs);
        }
    });
}

export function readPosts(blogId, callback, callback2, offset, count) {
    dbFetchBlogPosts(blogId).then(posts => {
        if (callback !== undefined) callback(posts);
        request('readPosts', { blogId, offset, count }, res => {
            if (res.status === 1) {
                const posts = res.posts;
                posts.forEach(async netPost => {
                    dbUpdatePostById(netPost.id, netPost);
                });
                if (callback !== undefined) callback(posts);
                if (callback2 !== undefined) callback2(posts);
            }
        });
    });
}

export function readPostById(postId, callback) {
    request('readPostById', { postId }, res => {
        if (res.status === 1) {
            if (callback) callback(res.post);
        }
    });
}
