using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class phraseHandler : MonoBehaviour
{
    float vel = 0.08f;
    string text= "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";
    GameObject[] chars;
    float offset = 0f;
    public GameObject templatechar;
    line line;
    public GameObject lineobj;
    public GameObject charContainer;
    // Start is called before the first frame update
    void Start()
    {
        line = lineobj.GetComponent<line>();

        int initfontsize = 26;
        chars = new GameObject[text.Length];
        for(int i=0; i<text.Length; i++)
        {
            chars[i] = Instantiate(templatechar);
            chars[i].transform.parent = charContainer.transform;
            chars[i].GetComponent<charHandler>().setText(""+text[i]);
        }
    }

    // Update is called once per frame
    void Update()
    {
        followLine();
        movePhrase();
    }

    public void followLine()
    {
        float cumulativeOffset = 0f;
        int currentsegment = 0;

        // repeat for each character 
        for (int i = 0; i < text.Length; i++)
        {
            bool stopit = false;
            // get correct segment
            while (!stopit
                && offset + cumulativeOffset
                > line.cumulativelengths[currentsegment]
                + line.lengths[currentsegment])
            {
                currentsegment++;
                if (currentsegment >= line.numSegments) stopit = true;
            }
           // Debug.Log(currentsegment);

            if (currentsegment >= line.numSegments) currentsegment = 0;

            float charOffsetOnSegment = offset + cumulativeOffset - line.cumulativelengths[currentsegment];
            float ratio = charOffsetOnSegment / line.lengths[currentsegment];

            float charX = line.points[currentsegment*2].x + ratio * line.dx[currentsegment];
            float charY = line.points[currentsegment*2].y + ratio * line.dy[currentsegment];
            float angle = 0;// -line.angles[currentsegment];

            chars[i].transform.position = new Vector2(charX, charY);
            chars[i].transform.eulerAngles= new Vector3 (0f, 0f, angle);
            //chars[i].GetComponent<charHandler>().updateSize(10f+Mathf.Pow(line.zpos[currentsegment], 1f));
            if (line.fontsizegates.Count >= currentsegment && line.fontsizegates[currentsegment] != -1f)
            {
                chars[i].GetComponent<charHandler>().updateSize(line.fontsizegates[currentsegment]);
            }
            cumulativeOffset += chars[i].GetComponent<charHandler>().w;
        }
    }

    void movePhrase()
    {
        offset -= vel;
    }
}
