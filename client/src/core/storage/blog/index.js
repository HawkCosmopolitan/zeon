
import { db } from '../setup';

export async function dbSaveBlogAtOnce(blog) {
    await db.post({
        type: 'blog',
        data: blog,
        id: blog.id,
        roomId: blog.roomId
    });
}

export async function dbSaveBlog(blog) {
    let result = await db.post({
        type: 'blog',
        roomId: blog.roomId,
        data: blog
    });
    blog.id = result.id;
    return { blog: blog, rev: result.rev };
}

export function dbUpdateBlog(id, rev, blog) {
    db.put({
        _id: id,
        _rev: rev,
        id: blog.id,
        roomId: blog.roomId,
        type: 'blog',
        data: blog
    });
}

export async function dbUpdateBlogById(blogId, blog) {
    let data = await db.find({
        selector: { type: { $eq: "blog" }, id: { $eq: blogId } },
    });
    if (data.docs.length > 0) {
        db.put({
            _id: data.docs[0]._id,
            _rev: data.docs[0]._rev,
            id: blog.id,
            roomId: blog.roomId,
            type: 'blog',
            data: blog
        });
    }
}

export async function dbFindBlogById(blogId) {
    let data = await db.find({
        selector: { type: { $eq: "blog" }, id: { $eq: blogId } },
    });
    if (data.docs.length > 0) {
        return data.docs[0].data;
    } else {
        return null;
    }
}

export async function dbDeleteBlogById(blogId) {
    let data = await db.find({
        selector: { type: { $eq: "blog" }, id: { $eq: blogId } },
    });
    if (data.docs.length > 0) {
        db.remove(data.docs[0]);
    }
}

export async function dbFetchRoomBlogs(roomId) {
    let data = await db.find({
        selector: { type: { $eq: "blog" }, roomId: { $eq: roomId } },
    });
    return data.docs.map(packet => packet.data);
}

export async function dbSavePostAtOnce(post) {
    await db.post({
        type: 'post',
        data: post,
        id: post.id,
        blogId: post.blogId
    });
}

export async function dbSavePost(post) {
    let result = await db.post({
        type: 'post',
        blogId: post.blogId,
        data: post
    });
    post.id = result.id;
    return { post: post, rev: result.rev };
}

export function dbUpdatePost(id, rev, post) {
    db.put({
        _id: id,
        _rev: rev,
        id: post.id,
        type: 'post',
        data: post
    });
}

export async function dbDeletePostById(postId) {
    let data = await db.find({
        selector: { type: { $eq: "post" }, id: { $eq: postId } },
    });
    if (data.docs.length > 0) {
        db.remove(data.docs[0]);
    }
}

export async function dbFetchBlogPosts(blogId) {
    let data = await db.find({
        selector: { type: { $eq: "post" }, blogId: { $eq: blogId } },
    });
    return data.docs.map(packet => packet.data);
}

export async function dbUpdatePostById(postId, post) {
    let data = await db.find({
        selector: { type: { $eq: "post" }, id: { $eq: postId } },
    });
    if (data.docs.length > 0) {
        try {
            await db.put({
                _id: data.docs[0]._id,
                _rev: data.docs[0]._rev,
                id: post.id,
                type: 'post',
                blogId: post.blogId,
                data: post
            });
        } catch (ex) { }
        return true;
    } else {
        return false;
    }
}

export async function dbFindPostById(postId) {
    let data = await db.find({
        selector: { type: { $eq: "post" } },
    });
    if (data.docs.length > 0) {
        return data.docs[0].data;
    } else {
        return null;
    }
}

export async function dbSaveSection(section) {
    let result = await db.post({
        type: 'section',
        postId: section.postId,
        data: section
    });
    section.id = result.id;
    return { section: section, rev: result.rev };
}

export function dbUpdateSection(id, rev, section) {
    db.put({
        _id: id,
        _rev: rev,
        id: section.id,
        type: 'section',
        postId: section.postId,
        data: section
    });
}

export async function dbFetchSections(postId) {
    let data = await db.find({
        selector: { type: { $eq: "section" }, postId: { $eq: postId } },
    });
    let sortedData = data.docs.map(packet => packet.data);
    return sortedData;
}

export async function dbUpdateSectionById(postId, sectionId, section) {
    let data = await db.find({
        selector: { type: { $eq: "section" }, postId: { $eq: postId }, id: { $eq: sectionId } },
    });
    if (data.docs.length > 0) {
        db.put({
            _id: data.docs[0]._id,
            _rev: data.docs[0]._rev,
            id: section.id,
            type: 'section',
            postId: section.postId,
            data: section
        });
    }
}

export async function dbFindSectionById(postId, sectionId) {
    let data = await db.find({
        selector: { type: { $eq: "section" }, postId: { $eq: postId }, id: { $eq: sectionId } },
    });
    if (data.docs.length > 0) {
        return data.docs[0].data;
    } else {
        return null;
    }
}

export async function dbDeleteSectionById(postId, sectionId) {
    let data = await db.find({
        selector: { type: { $eq: "section" }, postId: { $eq: postId }, id: { $eq: sectionId } },
    });
    if (data.docs.length > 0) {
        db.remove(data.docs[0]);
    }
}
